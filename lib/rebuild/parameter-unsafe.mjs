import { AranTypeError } from "../error.mjs";
import { makeIntrinsicExpression } from "./intrinsic.mjs";
import { makeSimpleLiteral } from "./literal.mjs";
import { mangleParameter } from "./mangle.mjs";

const CODING = {
  "new.target": "(new.target);",
  "import.meta": "(import.meta);",
  "super.get": "((key) => (super[key]));",
  "super.set": "((key, val) => (super[key] = val));",
  "super.call": "((...args) => (super(...args)));",
};

/**
 * @type {(
 *   message: string,
 *   config: import("./config").Config
 * ) => import("estree-sentry").Expression<{}>}
 */
const makeThrowSyntaxArrowExpression = (message, config) => ({
  type: "ArrowFunctionExpression",
  id: null,
  async: false,
  generator: false,
  params: [],
  expression: false,
  body: {
    type: "BlockStatement",
    body: [
      {
        type: "ThrowStatement",
        argument: {
          type: "NewExpression",
          callee: makeIntrinsicExpression("SyntaxError", config),
          arguments: [makeSimpleLiteral(message)],
        },
      },
    ],
  },
});

/**
 * @type {(
 *   parameter: import("./parameter-unsafe").UnsafeParameter,
 *   config: import("./config").Config,
 * ) => import("estree-sentry").Expression<{}>}
 */
const makeAlternateExpression = (parameter, config) => {
  if (parameter === "import.meta" || parameter === "new.target") {
    return makeIntrinsicExpression("aran.deadzone", config);
  } else if (parameter === "super.get" || parameter === "super.set") {
    return makeThrowSyntaxArrowExpression("cannot access super", config);
  } else if (parameter === "super.call") {
    return makeThrowSyntaxArrowExpression("cannot call super", config);
  } else {
    throw new AranTypeError(parameter);
  }
};

/**
 * @type {(
 *   parameter: import("./parameter-unsafe").UnsafeParameter,
 *   config: import("./config").Config,
 * ) => import("estree-sentry").Statement<{}>[]}
 */
export const listUnsafeParameterDeclaration = (parameter, config) => [
  {
    type: "VariableDeclaration",
    kind: "let",
    declarations: [
      {
        type: "VariableDeclarator",
        id: mangleParameter(parameter, config),
        init: null,
      },
    ],
  },
  {
    type: "TryStatement",
    block: {
      type: "BlockStatement",
      body: [
        {
          type: "ExpressionStatement",
          directive: null,
          expression: {
            type: "AssignmentExpression",
            operator: "=",
            left: mangleParameter(parameter, config),
            right: {
              type: "CallExpression",
              optional: false,
              callee: {
                type: "Identifier",
                name: /** @type {import("estree-sentry").VariableName} */ (
                  "eval"
                ),
              },
              arguments: [makeSimpleLiteral(CODING[parameter])],
            },
          },
        },
      ],
    },
    handler: {
      type: "CatchClause",
      param: null,
      body: {
        type: "BlockStatement",
        body: [
          {
            type: "ExpressionStatement",
            directive: null,
            expression: {
              type: "AssignmentExpression",
              operator: "=",
              left: mangleParameter("import.meta", config),
              right: makeAlternateExpression(parameter, config),
            },
          },
        ],
      },
    },
    finalizer: null,
  },
];

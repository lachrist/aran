import { AranTypeError } from "../error.mjs";
import { getParameterFunctionName } from "../lang/index.mjs";
import { join } from "../util/index.mjs";
import { makeIntrinsicExpression } from "./intrinsic.mjs";
import { makeSimpleLiteral } from "./literal.mjs";
import { mangleParameter } from "./mangle.mjs";

const CODING = {
  "new.target": "(new.target);",
  "import.meta": "(import.meta);",
  "super.get": join(
    [
      `const ${getParameterFunctionName("super.get")} = (key) => super[key];`,
      `${getParameterFunctionName("super.get")};`,
    ],
    "\n",
  ),
  "super.set": join(
    [
      `const ${getParameterFunctionName("super.set")} = (key, val) => (super[key] = val);`,
      `${getParameterFunctionName("super.set")};`,
    ],
    "\n",
  ),
  "super.call": join(
    [
      `const ${getParameterFunctionName("super.call")} = (...args) => super(...args);`,
      `${getParameterFunctionName("super.call")};`,
    ],
    "\n",
  ),
};

/**
 * @type {(
 *   message: string,
 *   config: import("./config-internal").InternalConfig
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
 *   config: import("./config-internal").InternalConfig,
 * ) => import("estree-sentry").Expression<{}>}
 */
const makeAlternateExpression = (parameter, config) => {
  if (parameter === "import.meta" || parameter === "new.target") {
    return makeIntrinsicExpression("aran.deadzone_symbol", config);
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
 *   config: import("./config-internal").InternalConfig,
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

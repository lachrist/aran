import { AranTypeError } from "../error.mjs";
import { makeIntrinsicExpression } from "./intrinsic.mjs";
import { EVAL_IDENTIFIER, mangleArgument, mangleEval } from "./mangle.mjs";

/**
 * @type {(
 *   mode: "strict" | "sloppy",
 *   config: import("./config").Config,
 * ) => estree.Expression}
 */
const makeEvalArrow = (mode, config) => {
  if (mode === "strict") {
    const code_arg = mangleArgument("code", config);
    return {
      type: "ArrowFunctionExpression",
      async: false,
      expression: false,
      params: [code_arg],
      body: {
        type: "BlockStatement",
        body: [
          /** @type {estree.Directive} */ ({
            type: "ExpressionStatement",
            expression: {
              type: "Literal",
              value: "use strict",
            },
            directive: "use strict",
          }),
          {
            type: "IfStatement",
            test: {
              type: "BinaryExpression",
              operator: "===",
              left: EVAL_IDENTIFIER,
              right: makeIntrinsicExpression("eval", config),
            },
            consequent: {
              type: "ReturnStatement",
              argument: {
                type: "CallExpression",
                optional: false,
                callee: EVAL_IDENTIFIER,
                arguments: [code_arg],
              },
            },
            alternate: {
              type: "ThrowStatement",
              argument: {
                type: "NewExpression",
                callee: makeIntrinsicExpression("ReferenceError", config),
                arguments: [
                  {
                    type: "Literal",
                    value:
                      "aran cannot perform the requested operation because the 'eval' variable no longer refer to the intrinsic 'eval' value",
                  },
                ],
              },
            },
          },
        ],
      },
    };
  } else if (mode === "sloppy") {
    const code_arg = mangleArgument("code", config);
    return {
      type: "CallExpression",
      optional: false,
      callee: {
        type: "ArrowFunctionExpression",
        async: false,
        expression: true,
        params: [EVAL_IDENTIFIER],
        body: {
          type: "ArrowFunctionExpression",
          async: false,
          expression: true,
          params: [code_arg],
          body: {
            type: "CallExpression",
            optional: false,
            callee: EVAL_IDENTIFIER,
            arguments: [code_arg],
          },
        },
      },
      arguments: [makeIntrinsicExpression("eval", config)],
    };
  } else {
    throw new AranTypeError(mode);
  }
};

/**
 * @type {(
 *   mode: "strict" | "sloppy",
 *   config: import("./config").Config,
 * ) => [
 *   estree.Identifier,
 *   estree.Expression,
 * ]}
 */
const makeEvalDeclarator = (mode, config) => [
  mangleEval(mode, config),
  makeEvalArrow(mode, config),
];

/**
 * @type {(
 *   mode: "strict" | "sloppy",
 *   config: import("./config").Config,
 * ) => [
 *   estree.Identifier,
 *   estree.Expression,
 * ][]}
 */
export const listEvalDeclarator = (mode, config) => {
  switch (mode) {
    case "sloppy": {
      return [
        makeEvalDeclarator("strict", config),
        makeEvalDeclarator("sloppy", config),
      ];
    }
    case "strict": {
      return [makeEvalDeclarator("strict", config)];
    }
    default: {
      throw new AranTypeError(mode);
    }
  }
};

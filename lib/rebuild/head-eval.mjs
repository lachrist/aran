import { AranTypeError } from "../error.mjs";
import { makeExternalIntrinsicExpression } from "./intrinsic.mjs";
import { mangleArgument, mangleEval } from "./mangle.mjs";

/**
 * @type {(
 *   mode: "strict" | "sloppy",
 *   config: import("./config").Config,
 * ) => estree.Expression}
 */
export const makeEvalArrow = (mode, config) => {
  if (mode === "strict") {
    const eval_arg = mangleArgument("eval", config.escape_prefix);
    const code_arg = mangleArgument("code", config.escape_prefix);
    const error_arg = mangleArgument("error", config.escape_prefix);
    return {
      type: "CallExpression",
      optional: false,
      callee: {
        type: "ArrowFunctionExpression",
        async: false,
        expression: true,
        params: [
          {
            type: "Identifier",
            name: eval_arg,
          },
          {
            type: "Identifier",
            name: error_arg,
          },
        ],
        body: {
          type: "ArrowFunctionExpression",
          async: false,
          expression: false,
          params: [
            {
              type: "Identifier",
              name: code_arg,
            },
          ],
          body: {
            type: "BlockStatement",
            body: [
              {
                type: "IfStatement",
                test: {
                  type: "BinaryExpression",
                  operator: "===",
                  left: {
                    type: "Identifier",
                    name: "eval",
                  },
                  right: {
                    type: "Identifier",
                    name: eval_arg,
                  },
                },
                consequent: {
                  type: "ReturnStatement",
                  argument: {
                    type: "CallExpression",
                    optional: false,
                    callee: {
                      type: "Identifier",
                      name: "eval",
                    },
                    arguments: [
                      {
                        type: "Identifier",
                        name: code_arg,
                      },
                    ],
                  },
                },
                alternate: {
                  type: "ThrowStatement",
                  argument: {
                    type: "NewExpression",
                    callee: {
                      type: "Identifier",
                      name: error_arg,
                    },
                    arguments: [
                      {
                        type: "Literal",
                        value:
                          "aran cannot perform the requested operation because the 'eval' variable no longer refer to the original 'eval' value",
                      },
                    ],
                  },
                },
              },
            ],
          },
        },
      },
      arguments: [
        makeExternalIntrinsicExpression("eval", config),
        makeExternalIntrinsicExpression("ReferenceError", config),
      ],
    };
  } else if (mode === "sloppy") {
    const code_arg = mangleArgument("code", config.escape_prefix);
    return {
      type: "CallExpression",
      optional: false,
      callee: {
        type: "ArrowFunctionExpression",
        async: false,
        expression: true,
        params: [
          {
            type: "Identifier",
            name: "eval",
          },
        ],
        body: {
          type: "ArrowFunctionExpression",
          async: false,
          expression: true,
          params: [
            {
              type: "Identifier",
              name: code_arg,
            },
          ],
          body: {
            type: "CallExpression",
            optional: false,
            callee: {
              type: "Identifier",
              name: "eval",
            },
            arguments: [
              {
                type: "Identifier",
                name: code_arg,
              },
            ],
          },
        },
      },
      arguments: [makeExternalIntrinsicExpression("eval", config)],
    };
  } else {
    throw new AranTypeError(mode);
  }
};

/**
 * @type {(
 *   mode: "strict" | "sloppy",
 *   config: import("./config").Config,
 * ) => estree.Statement}
 */
export const makeEvalDeclaration = (mode, config) => ({
  type: "VariableDeclaration",
  kind: "const",
  declarations: [
    {
      type: "VariableDeclarator",
      id: {
        type: "Identifier",
        name: mangleEval(config.escape_prefix),
      },
      init: makeEvalArrow(mode, config),
    },
  ],
});

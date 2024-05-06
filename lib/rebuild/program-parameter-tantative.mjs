import { makeIntrinsicExpression } from "./intrinsic.mjs";
import { mangleParameter } from "./mangle.mjs";

const precompile = {
  "super.get": "((key) => super[key]);",
  "super.set": "((key, val) => super[key] = val);",
  "super.call": "((...args) => super(...args));",
  "import.meta": "(import.meta);",
  "new.target": "(new.target);",
};

/**
 * @type {(
 *   code: estree.Expression,
 *   config: import("./config").Config,
 * ) => estree.Expression}
 */
const compile = (code, config) => ({
  type: "CallExpression",
  optional: false,
  callee: {
    type: "FunctionExpression",
    async: false,
    id: null,
    generator: false,
    params: [],
    body: {
      type: "BlockStatement",
      body: [
        {
          type: "IfStatement",
          test: {
            type: "BinaryExpression",
            operator: "===",
            right: {
              type: "Identifier",
              name: "eval",
            },
            left: makeIntrinsicExpression("eval", config),
          },
          consequent: {
            type: "TryStatement",
            block: {
              type: "BlockStatement",
              body: [
                {
                  type: "ReturnStatement",
                  argument: {
                    type: "CallExpression",
                    optional: false,
                    callee: {
                      type: "Identifier",
                      name: "eval",
                    },
                    arguments: [code],
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
                    type: "ReturnStatement",
                    argument: {
                      type: "Literal",
                      value: null,
                    },
                  },
                ],
              },
            },
            finalizer: null,
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
                    "aran cannot prepare some tantative parameters because the 'eval' variable no longer refer to the intrinsic 'eval' value",
                },
              ],
            },
          },
        },
      ],
    },
  },
  arguments: [],
});

/**
 * @type {[
 *   "import.meta",
 *   "new.target",
 *   "super.get",
 *   "super.set",
 *   "super.call",
 * ]}
 */
export const TANTATIVE_PARAMETER_ENUM = [
  "import.meta",
  "new.target",
  "super.get",
  "super.set",
  "super.call",
];

/**
 * @type {(
 *   parameter: (
 *     | "import.meta"
 *     | "new.target"
 *     | "super.get"
 *     | "super.set"
 *     | "super.call"
 *   ),
 *   config: import("./config").Config,
 * ) => estree.Statement}
 */
export const initializeTantativeParameter = (parameter, config) => ({
  type: "VariableDeclaration",
  kind: "let",
  declarations: [
    {
      type: "VariableDeclarator",
      id: mangleParameter(parameter, config),
      init: compile({ type: "Literal", value: precompile[parameter] }, config),
    },
  ],
});

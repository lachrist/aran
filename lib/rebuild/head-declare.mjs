import { compileGet, join, map } from "../util/index.mjs";
import { mangleEval } from "./mangle.mjs";

const getVariable = compileGet("variable");

/**
 * @type {(
 *   header: import("../header").DeclareHeader,
 * ) => estree.Statement}
 */
export const makeEarlyDeclaration = ({ kind, variable }) => ({
  type: "VariableDeclaration",
  kind,
  declarations: [
    {
      type: "VariableDeclarator",
      id: {
        type: "Identifier",
        name: variable,
      },
      init: null,
    },
  ],
});

/**
 * @type {(
 *   variable: estree.Variable,
 * ) => string}
 */
const declare = (variable) => `var ${variable};\n`;

/**
 * @type {(
 *   head: import("../header").DeclareHeader[],
 *   config: import("./config").Config,
 * ) => estree.Statement[]}
 */
export const makeLateDeclaration = (head, config) =>
  head.length === 0
    ? []
    : [
        {
          type: "ExpressionStatement",
          expression: {
            type: "CallExpression",
            optional: false,
            callee: {
              type: "Identifier",
              name: mangleEval(config.escape),
            },
            arguments: [
              {
                type: "Literal",
                value: join(map(map(head, getVariable), declare), ""),
              },
            ],
          },
        },
      ];

import { compileGet, join, map } from "../util/index.mjs";
import { mangleEval, mangleExternal } from "./mangle.mjs";

const getVariable = compileGet("variable");

/**
 * @type {(
 *   header: import("../header").EarlyStaticDeclareHeader,
 *   config: import("./config").Config,
 * ) => estree.Statement}
 */
export const makeDeclaration = ({ kind, variable }, config) => ({
  type: "VariableDeclaration",
  kind,
  declarations: [
    {
      type: "VariableDeclarator",
      id: mangleExternal(variable, config),
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
 *   head: import("../header").EarlyStaticDeclareHeader[],
 *   config: import("./config").Config,
 * ) => estree.Statement[]}
 */
export const listEarlyDeclaration = (head, config) =>
  map(head, (variable) => makeDeclaration(variable, config));

/**
 * @type {(
 *   mode: "strict" | "sloppy",
 *   head: import("../header").LateStaticDeclareHeader[],
 *   config: import("./config").Config,
 * ) => estree.Statement[]}
 */
export const makeLateDeclaration = (mode, head, config) =>
  head.length === 0
    ? []
    : [
        {
          type: "ExpressionStatement",
          expression: {
            type: "CallExpression",
            optional: false,
            callee: mangleEval(mode, config),
            arguments: [
              {
                type: "Literal",
                value: join(map(map(head, getVariable), declare), ""),
              },
            ],
          },
        },
      ];

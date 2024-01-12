import {
  isDeepDeclareHeader,
  isPrepareDeepDeclareHeader,
  isShallowDeclareHeader,
} from "../header.mjs";
import { compileGet, filterNarrow, join, map, some } from "../util/index.mjs";
import { EVAL, mangleArgument } from "./mangle.mjs";

const getVariable = compileGet("variable");

/**
 * @type {(
 *   header: import("../header").ShallowDeclareHeader,
 * ) => estree.Statement}
 */
const makeShallowDeclaration = ({ kind, variable }) => ({
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
 *   head: import("../header").DeepDeclareHeader[],
 * ) => estree.Statement[]}
 */
const makeDeepDeclaration = (head) =>
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
              name: EVAL,
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

/**
 * @type {(
 *   head: import("../header").DeclareHeader[],
 * ) => estree.Statement[]}
 */
export const listDeclaration = (head) => [
  ...map(filterNarrow(head, isShallowDeclareHeader), makeShallowDeclaration),
  ...makeDeepDeclaration(filterNarrow(head, isDeepDeclareHeader)),
];

/**
 * @type {(
 *   head: import("../header").DeclareHeader[],
 *   config: import("./config").Config,
 * ) => [
 *   estree.Identifier,
 *   estree.Expression,
 * ][]}
 */
export const listDeclarationEntry = (head, config) => {
  if (some(head, isPrepareDeepDeclareHeader)) {
    const code_arg = mangleArgument("code", config.escape);
    return [
      [
        { type: "Identifier", name: EVAL },
        {
          type: "ArrowFunctionExpression",
          expression: true,
          async: false,
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
                type: "Literal",
                value: code_arg,
              },
            ],
          },
        },
      ],
    ];
  } else {
    return [];
  }
};

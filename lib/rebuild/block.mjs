import { map, reduceReverse } from "../util/index.mjs";
import { rebuildExpression } from "./expression.mjs";
import { mangleLabel, mangleVariable } from "./mangle.mjs";
import { rebuildStatement } from "./statement.mjs";

/**
 * @type {(
 *   node: aran.ClosureBlock<rebuild.Atom>,
 *   config: import("./config").Config,
 * ) => estree.Statement[]}
 */
export const rebuildClosureBlock = (node, config) => [
  .../** @type {estree.Statement[]} */ (
    node.variables.length === 0
      ? []
      : [
          {
            type: "VariableDeclaration",
            kind: "let",
            declarations: map(node.variables, (variable) => ({
              type: "VariableDeclarator",
              id: {
                type: "Identifier",
                name: mangleVariable(variable),
              },
              init: null,
            })),
          },
        ]
  ),
  ...map(node.statements, (child) => rebuildStatement(child, config)),
  {
    type: "ReturnStatement",
    argument: rebuildExpression(node.completion, config),
  },
];

/** @type {(node: estree.Statement, label: rebuild.Label) => estree.Statement} */
const accumulateLabel = (node, label) => ({
  type: "LabeledStatement",
  label: {
    type: "Identifier",
    name: mangleLabel(label),
  },
  body: node,
});

/**
 * @type {(
 *   node: aran.ControlBlock<rebuild.Atom>,
 *   config: import("./config").Config,
 * ) => estree.Statement}
 */
export const rebuildControlBlock = (node, config) =>
  reduceReverse(node.labels, accumulateLabel, {
    type: "BlockStatement",
    body: [
      .../** @type {estree.Statement[]} */ (
        node.variables.length === 0
          ? []
          : [
              {
                type: "VariableDeclaration",
                kind: "let",
                declarations: map(node.variables, (variable) => ({
                  type: "VariableDeclarator",
                  id: {
                    type: "Identifier",
                    name: mangleVariable(variable),
                  },
                  init: null,
                })),
              },
            ]
      ),
      ...map(node.statements, (child) => rebuildStatement(child, config)),
    ],
  });

// });

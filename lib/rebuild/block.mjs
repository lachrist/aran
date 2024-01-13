import { AranTypeError } from "../error.mjs";
import { map, reduceReverse } from "../util/index.mjs";
import { rebuildExpression } from "./expression.mjs";
import { mangleLabel, mangleVariable } from "./mangle.mjs";
import { rebuildStatement } from "./statement.mjs";

/**
 * @type {(
 *   node: aran.Expression<rebuild.Atom>,
 *   config: import("./config").Config,
 *   options: {
 *     completion: "return" | "expression",
 *   },
 * ) => estree.Statement}
 */
const makeCompletion = (node, config, { completion }) => {
  if (completion === "return") {
    return {
      type: "ReturnStatement",
      argument: rebuildExpression(node, config),
    };
  } else if (completion === "expression") {
    return {
      type: "ExpressionStatement",
      expression: rebuildExpression(node, config),
    };
  } else {
    throw new AranTypeError(completion);
  }
};

/**
 * @type {(
 *   node: aran.ClosureBlock<rebuild.Atom>,
 *   config: import("./config").Config,
 *   options: {
 *     completion: "return" | "expression",
 *   },
 * ) => estree.Statement[]}
 */
export const rebuildClosureBlock = (node, config, options) => [
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
  makeCompletion(node.completion, config, options),
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

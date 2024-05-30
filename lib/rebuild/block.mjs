import { AranTypeError } from "../error.mjs";
import { map, reduceReverse } from "../util/index.mjs";
import { rebuildExpression } from "./expression.mjs";
import { makeIntrinsicExpression } from "./intrinsic.mjs";
import { mangleLabel, mangleVariable } from "./mangle.mjs";
import { rebuildStatement } from "./statement.mjs";

/**
 * @type {(
 *   node: import("./atom").Expression,
 *   config: import("./config").Config,
 *   options: {
 *     completion: "return" | "expression",
 *   },
 * ) => import("../estree").Statement}
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
 *   node: import("./atom").RoutineBlock,
 *   config: import("./config").Config,
 *   options: {
 *     completion: "return" | "expression",
 *   },
 * ) => import("../estree").Statement[]}
 */
export const rebuildClosureBlock = (node, config, options) => [
  .../** @type {import("../estree").Statement[]} */ (
    node.frame.length === 0
      ? []
      : [
          {
            type: "VariableDeclaration",
            kind: "let",
            declarations: map(node.frame, ([variable, intrinsic]) => ({
              type: "VariableDeclarator",
              id: mangleVariable(variable, config),
              init:
                intrinsic === "undefined"
                  ? null
                  : makeIntrinsicExpression(intrinsic, config),
            })),
          },
        ]
  ),
  ...map(node.body, (child) => rebuildStatement(child, config)),
  makeCompletion(node.completion, config, options),
];

/**
 * @type {(
 *   node: import("../estree").Statement,
 *   label: import("./atom").Label,
 * ) => import("../estree").Statement}
 */
const accumulateLabel = (node, label) => ({
  type: "LabeledStatement",
  label: mangleLabel(label),
  body: node,
});

/**
 * @type {(
 *   node: import("./atom").ControlBlock,
 *   config: import("./config").Config,
 * ) => import("../estree").Statement}
 */
export const rebuildControlBlock = (node, config) =>
  reduceReverse(node.labels, accumulateLabel, {
    type: "BlockStatement",
    body: [
      .../** @type {import("../estree").Statement[]} */ (
        node.frame.length === 0
          ? []
          : [
              {
                type: "VariableDeclaration",
                kind: "let",
                declarations: map(node.frame, ([variable, intrinsic]) => ({
                  type: "VariableDeclarator",
                  id: mangleVariable(variable, config),
                  init:
                    intrinsic === "undefined"
                      ? null
                      : makeIntrinsicExpression(intrinsic, config),
                })),
              },
            ]
      ),
      ...map(node.body, (child) => rebuildStatement(child, config)),
    ],
  });

// });

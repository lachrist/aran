import { AranTypeError } from "../error.mjs";
import { map, reduceReverse } from "../util/index.mjs";
import { rebuildExpression } from "./expression.mjs";
import { makeIntrinsicExpression } from "./intrinsic.mjs";
import { makeJsonExpression } from "./json.mjs";
import { mangleLabel, mangleVariable } from "./mangle.mjs";
import { makePrimitiveExpression } from "./primitive.mjs";
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
 *   isolate: aran.Isolate,
 *   config: import("./config").Config,
 * ) => estree.Expression}
 */
const makeIsolateExpression = (isolate, config) => {
  switch (isolate.type) {
    case "primitive": {
      return makePrimitiveExpression(isolate.primitive);
    }
    case "intrinsic": {
      return makeIntrinsicExpression(isolate.intrinsic, config);
    }
    case "json": {
      return makeJsonExpression(isolate.json);
    }
    default: {
      throw new AranTypeError(isolate);
    }
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
    node.frame.length === 0
      ? []
      : [
          {
            type: "VariableDeclaration",
            kind: "let",
            declarations: map(node.frame, ([variable, isolate]) => ({
              type: "VariableDeclarator",
              id: mangleVariable(variable, config),
              init: makeIsolateExpression(isolate, config),
            })),
          },
        ]
  ),
  ...map(node.body, (child) => rebuildStatement(child, config)),
  makeCompletion(node.completion, config, options),
];

/** @type {(node: estree.Statement, label: rebuild.Label) => estree.Statement} */
const accumulateLabel = (node, label) => ({
  type: "LabeledStatement",
  label: mangleLabel(label),
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
        node.frame.length === 0
          ? []
          : [
              {
                type: "VariableDeclaration",
                kind: "let",
                declarations: map(node.frame, ([variable, isolate]) => ({
                  type: "VariableDeclarator",
                  id: mangleVariable(variable, config),
                  init: makeIsolateExpression(isolate, config),
                })),
              },
            ]
      ),
      ...map(node.body, (child) => rebuildStatement(child, config)),
    ],
  });

// });

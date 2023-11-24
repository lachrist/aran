// Optional apply is not direct eval call:
//
// > (((x) => eval?.("x")) (123))
// Uncaught ReferenceError: x is not defined
//
// Spread apply is not direct eval call:
//
// (((x) => eval?.(...["x"])) (123))
// Uncaught ReferenceError: x is not defined

import { listChild } from "./child.mjs";

/** @type {(node: estree.Node) => boolean} */
export const isDirectEvalCall = (node) =>
  node.type === "CallExpression" &&
  !node.optional &&
  node.callee.type === "Identifier" &&
  node.callee.name === "eval" &&
  node.arguments.length > 0 &&
  node.arguments[0].type !== "SpreadElement";

/**
 * @type {(
 *   node: estree.Node,
 * ) => boolean}
 */
export const isAwaitExpression = (node) => node.type === "AwaitExpression";

/**
 * @type {(
 *   node: estree.Node,
 * ) => boolean}
 */
export const isYieldExpression = (node) => node.type === "YieldExpression";

/**
 * @type {(
 *   nodes: estree.Node[],
 *   predicate: (node: estree.Node) => boolean,
 * ) => boolean}
 */
export const hasClosureNode = (nodes, predicate) => {
  for (const node of nodes) {
    if (predicate(node)) {
      return true;
    }
    if (
      node.type === "ArrowFunctionExpression" ||
      node.type === "FunctionExpression" ||
      node.type === "FunctionDeclaration"
    ) {
      return false;
    }
    if (hasClosureNode(listChild(node), predicate)) {
      return true;
    }
  }
  return false;
};

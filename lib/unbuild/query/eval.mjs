// Optional apply is not direct eval call:
//
// > (((x) => eval?.("x")) (123))
// Uncaught ReferenceError: x is not defined
//
// Spread apply is not direct eval call:
//
// (((x) => eval?.(...["x"])) (123))
// Uncaught ReferenceError: x is not defined

import { some } from "../../util/index.mjs";
import { listChild } from "./child.mjs";

/**
 * @type {(
 *   node: import("../../estree").Node
 * ) => node is import("../../estree").CallExpression & {
 *   optional: false,
 *   callee: import("../../estree").VariableIdentifier & {
 *     name: "eval",
 *   },
 * }}
 */
export const isDirectEvalCall = (node) =>
  node.type === "CallExpression" &&
  !node.optional &&
  node.callee.type === "Identifier" &&
  node.callee.name === "eval";

/**
 * @type {(
 *   node: import("../../estree").Node,
 * ) => boolean}
 */
export const hasDirectEvalCall = (node) => {
  if (isDirectEvalCall(node)) {
    return true;
  }
  if (
    node.type === "ArrowFunctionExpression" ||
    node.type === "FunctionExpression" ||
    node.type === "FunctionDeclaration" ||
    node.type === "ClassExpression" ||
    node.type === "ClassDeclaration"
  ) {
    return false;
  }
  return some(listChild(node), hasDirectEvalCall);
};

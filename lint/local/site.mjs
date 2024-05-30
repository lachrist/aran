/**
 * @type {(
 *   node: import("estree").AssignmentExpression,
 * ) => boolean}
 */
export const isNextMetaAssignment = (node) =>
  node.left.type === "Identifier" &&
  node.left.name === "meta" &&
  node.right.type === "CallExpression" &&
  node.right.callee.type === "Identifier" &&
  node.right.callee.name === "nextMeta" &&
  node.right.arguments.length === 1 &&
  node.right.arguments[0].type === "Identifier" &&
  node.right.arguments[0].name === "meta";

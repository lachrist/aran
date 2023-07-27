/* eslint-disable no-use-before-define */

/** @type {(node: EstreeNode, kind: "break" | "continue") => boolean} */
const visit = (node, kind) => {
  if (node.type === "BreakStatement") {
    return kind === "break" && node.label == null;
  } else if (node.type === "ContinueStatement") {
    return kind === "continue" && node.label == null;
  } else if (node.type === "LabeledStatement") {
    return visit(node.body, kind);
  } else if (node.type === "BlockStatement") {
    return visitArray(node.body, kind);
  } else if (node.type === "IfStatement") {
    return visit(node.consequent, kind) || visitMaybe(node.alternate, kind);
  } else if (node.type === "WithStatement") {
    return visit(node.body, kind);
  } else if (node.type === "TryStatement") {
    return (
      visit(node.block, kind) ||
      visitMaybe(node.handler, kind) ||
      visitMaybe(node.finalizer, kind)
    );
  } else if (node.type === "CatchClause") {
    return visit(node.body, kind);
  } else if (node.type === "SwitchStatement") {
    if (kind === "break") {
      return false;
    } else {
      return visitArray(node.cases, kind);
    }
  } else if (node.type === "SwitchCase") {
    return visitArray(node.consequent, kind);
  } else {
    return false;
  }
};

/** @type {(maybe_node: EstreeNode | null | undefined, kind: "break" | "continue") => boolean} */
const visitMaybe = (maybe_node, kind) =>
  maybe_node == null ? false : visit(maybe_node, kind);

/** @type {(nodes: EstreeNode[], kind: "break" | "continue") => boolean} */
const visitArray = (nodes, kind) => {
  const { length } = nodes;
  for (let index = 0; index < length; index += 1) {
    if (visit(nodes[index], kind)) {
      return true;
    }
  }
  return false;
};

/** @type {(node: EstreeNode) => boolean} */
export const hasEmptyBreak = (node) => visit(node, "break");

/** @type {(node: EstreeNode) => boolean} */
export const hasEmptyContinue = (node) => visit(node, "continue");

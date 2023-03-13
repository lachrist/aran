import { hasOwn, partial_x } from "../util/index.mjs";

/* eslint-disable no-use-before-define */
const visit = (node, kind) => {
  const { type } = node;
  if (hasOwn(visitors, type)) {
    const visitor = visitors[type];
    return visitor(node, kind);
  } else {
    return false;
  }
};
/* eslint-enable no-use-before-define */

const visitMaybe = (maybe_node, kind) =>
  maybe_node === null ? false : visit(maybe_node, kind);

const visitArray = (nodes, kind) => {
  const { length } = nodes;
  for (let index = 0; index < length; index += 1) {
    if (visit(nodes[index], kind)) {
      return true;
    }
  }
  return false;
};

const visitors = {
  BreakStatement: (node, kind) => kind === "break" && node.label === null,
  ContinueStatement: (node, kind) => kind === "continue" && node.label === null,
  LabeledStatement: (node, kind) => visit(node.body, kind),
  BlockStatement: (node, kind) => visitArray(node.body, kind),
  IfStatement: (node, kind) =>
    visit(node.consequent, kind) || visitMaybe(node.alternate, kind),
  WithStatement: (node, kind) => visit(node.body, kind),
  TryStatement: (node, kind) =>
    visit(node.block, kind) ||
    visitMaybe(node.handler, kind) ||
    visitMaybe(node.finalizer, kind),
  CatchClause: (node, kind) => visit(node.body, kind),
  SwitchStatement: (node, kind) => {
    if (kind === "break") {
      return false;
    } else {
      return visitArray(node.cases, kind);
    }
  },
  SwitchCase: (node, kind) => visitArray(node.consequent, kind),
};

export const hasEmptyBreak = partial_x(visit, "break");

export const hasEmptyContinue = partial_x(visit, "continue");

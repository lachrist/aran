import { pop, push, pushAll, removeDuplicate } from "../../util/index.mjs";

import { listChild } from "../../query.mjs";
import { isMetaVariable } from "./variable.mjs";

/** @typedef {import("./variable.mjs").MetaVariable} MetaVariable */

/** @type {<T>(nodes: Node<T>[]) => MetaVariable[]} */
export const collectFreeMetaVariable = (nodes) => {
  nodes = [...nodes];
  /** @type {MetaVariable[]} */
  const variables = [];
  while (nodes.length > 0) {
    const node = pop(nodes);
    const { type } = node;
    if (
      (type === "ReadExpression" || type === "WriteEffect") &&
      isMetaVariable(node.variable)
    ) {
      push(variables, node.variable);
    }
    if (
      type !== "ControlBlock" &&
      type !== "ClosureBlock" &&
      type !== "PseudoBlock"
    ) {
      pushAll(nodes, listChild(node));
    }
  }
  return removeDuplicate(variables);
};

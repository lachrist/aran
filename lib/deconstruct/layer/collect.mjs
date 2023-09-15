import { pop, push, pushAll, removeDuplicate } from "../../util/index.mjs";
import { isParameter } from "../../node.mjs";
import { listChild } from "../../query.mjs";

/**
 * @template {string} V
 * @template T
 * @param {aran.Node<V, T>[]} nodes
 * @return {V[]}
 */
export const collectFreeVariable = (nodes) => {
  nodes = [...nodes];
  /** @type {V[]} */
  const variables = [];
  while (nodes.length > 0) {
    const node = pop(nodes);
    const { type } = node;
    if (
      (type === "ReadExpression" || type === "WriteEffect") &&
      !isParameter(node.variable)
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

import { pop, push, pushAll, removeDuplicate } from "../../util/index.mjs";
import { isParameter } from "../../lang.mjs";
import { listChild } from "../../query.mjs";

/**
 * @type {<T>(
 *   nodes: aran.Node<unbuild.Atom<T>>[],
 * ) => unbuild.Variable[]}
 */
export const collectFreeVariable = (nodes) => {
  nodes = [...nodes];
  /** @type {unbuild.Variable[]} */
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

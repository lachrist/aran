import { pop, push, pushAll } from "../../util/index.mjs";
import { listChild } from "../../lang.mjs";

/**
 * @type {<S>(
 *   nodes: aran.Node<unbuild.Atom<S>>[],
 * ) => unbuild.Variable[]}
 */
export const collectBoundVariable = (nodes) => {
  nodes = [...nodes];
  /** @type {unbuild.Variable[]} */
  const variables = [];
  while (nodes.length > 0) {
    const node = pop(nodes);
    const {
      type,
      tag: { initialization },
    } = node;
    if (initialization !== null) {
      push(variables, initialization);
    }
    if (
      type !== "ControlBlock" &&
      type !== "ClosureBlock" &&
      type !== "PseudoBlock"
    ) {
      pushAll(nodes, listChild(node));
    }
  }
  return variables;
};

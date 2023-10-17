/* eslint-disable local/no-impure */
import { listChild } from "../../lang.mjs";

/**
 * @type {(
 *   nodes: aran.Node<unbuild.Atom>[],
 * ) => unbuild.Variable[]}
 */
export const collectBoundVariable = (nodes) => {
  const stack = [...nodes];
  let todo = stack.length;
  /** @type {unbuild.Variable[]} */
  const variables = [];
  let length = 0;
  while (todo > 0) {
    todo -= 1;
    const node = stack[todo];
    const {
      type,
      tag: { initialization },
    } = node;
    if (initialization !== null) {
      variables[length] = initialization;
      length += 1;
    }
    if (
      type !== "ControlBlock" &&
      type !== "ClosureBlock" &&
      type !== "PseudoBlock"
    ) {
      for (const child of listChild(node)) {
        stack[todo] = child;
        todo += 1;
      }
    }
  }
  return variables;
};

/* eslint-disable local/no-impure */
import { isParameter, listChild } from "../lang.mjs";
import { isInitialization } from "./node.mjs";

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
    if (node.type === "WriteEffect" && isInitialization(node)) {
      const { variable } = node;
      if (!isParameter(variable)) {
        variables[length] = variable;
        length += 1;
      }
    }
    if (
      node.type !== "ControlBlock" &&
      node.type !== "ClosureBlock" &&
      node.type !== "PseudoBlock"
    ) {
      for (const child of listChild(node)) {
        stack[todo] = child;
        todo += 1;
      }
    }
  }
  return variables;
};

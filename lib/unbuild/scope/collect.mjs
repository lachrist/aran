/* eslint-disable local/no-impure */
import { listChild } from "../../lang.mjs";
import { isMetaVariable } from "../mangle.mjs";
import { isInitialization } from "../node.mjs";

/**
 * @type {(
 *   nodes: aran.Node<unbuild.Atom>[],
 * ) => unbuild.Variable[]}
 */
export const collectBoundMetaVariable = (nodes) => {
  const stack = [...nodes];
  let todo = stack.length;
  /** @type {unbuild.MetaVariable[]} */
  const variables = [];
  let length = 0;
  while (todo > 0) {
    todo -= 1;
    const node = stack[todo];
    const {
      type,
      tag: { initialization },
    } = node;
    if (
      initialization !== null &&
      node.type === "WriteEffect" &&
      isInitialization(node)
    ) {
      const { variable } = node;
      if (isMetaVariable(variable)) {
        variables[length] = variable;
        length += 1;
      }
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

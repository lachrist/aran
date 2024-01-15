import { hasNarrowObject } from "../../util/index.mjs";

const {
  Array: { isArray },
} = globalThis;

/** @type {(unknown: unknown) => unknown is estree.Node} */
const isEstreeNode = (unknown) =>
  typeof unknown === "object" &&
  unknown !== null &&
  hasNarrowObject(unknown, "type");

/**
 * @type {(
 *   key: string,
 * ) => boolean}
 */
const isNodeKey = (key) =>
  key !== "type" &&
  key !== "leadingComments" &&
  key !== "trailingComments" &&
  key !== "loc" &&
  key !== "range" &&
  key !== "start" &&
  key !== "end";

/* eslint-disable local/no-impure */
/**
 * @type {(
 *   node: estree.Node,
 * ) => estree.Node[]}
 */
export const listChild = (node) => {
  /** @type {estree.Node[]} */
  const nodes = [];
  let length = 0;
  for (const key in node) {
    if (isNodeKey(key)) {
      const child = /** @type {{[k in string]: unknown}} */ (
        /** @type {unknown} */ (node)
      )[key];
      if (isEstreeNode(child)) {
        nodes[length] = child;
        length += 1;
      } else if (isArray(child)) {
        for (const item of child) {
          if (isEstreeNode(item)) {
            nodes[length] = item;
            length += 1;
          }
        }
      }
    }
  }
  return nodes;
};
/* eslint-enable local/no-impure */

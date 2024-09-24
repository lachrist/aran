import { hasNarrowObject } from "./util/index.mjs";

const {
  Array: { isArray },
} = globalThis;

/**
 * @type {(
 *   data: unknown
 * ) => data is import("./estree").Node}
 */
const isNode = (data) =>
  typeof data === "object" &&
  data !== null &&
  hasNarrowObject(data, "type") &&
  typeof data.type === "string";

/* eslint-disable local/no-impure */
/**
 * @type {(
 *   root: import("./estree").Program,
 *   hash: import("./hash").Hash,
 *   digest: import("./hash").Digest,
 * ) => import("./estree").Node | null}
 */
export const retreive = (root, hash, digest) => {
  /** @type {import("./estree").Node[]} */
  const todo = [root];
  let length = 1;
  while (length > 0) {
    const node = todo[--length];
    if (digest(node) === hash) {
      return node;
    }
    for (const key in node) {
      if (hasNarrowObject(node, key)) {
        /** @type {unknown} */
        const child = /** @type {any} */ (node)[key];
        if (isArray(child)) {
          for (const grand_child of child) {
            if (isNode(grand_child)) {
              todo[length++] = grand_child;
            }
          }
        } else if (isNode(child)) {
          todo[length++] = child;
        }
      }
    }
  }
  return null;
};
/* eslint-enable local/no-impure */

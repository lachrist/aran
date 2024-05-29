import { AranError } from "./error.mjs";
import { hasNarrowObject } from "./util/index.mjs";

const {
  Reflect: { apply },
  String: {
    prototype: { split },
  },
} = globalThis;

const DOT = ["."];

export const ROOT_PATH = /** @type {import("./path").Path} */ ("$");

/**
 * @type {(
 *   path: import("./path").Path
 * ) => import("./path").Segment[]}
 */
export const splitPath = (path) => apply(split, path, DOT);

/* eslint-disable local/no-impure */
/**
 * @type {(
 *   path: string[],
 *   root: estree.Program,
 * ) => estree.Node | estree.Node[]}
 */
export const walkPath = (path, root) => {
  /** @type {estree.Node | estree.Node[]} */
  let node = root;
  for (const segment of path) {
    if (segment === "$") {
      node = root;
    } else if (hasNarrowObject(node, segment)) {
      node = /** @type {any} */ (node[segment]);
    } else {
      throw new AranError("invalid path", { path, root, node, segment });
    }
  }
  return node;
};
/* eslint-enable local/no-impure */

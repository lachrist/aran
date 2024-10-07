import { AranTypeError } from "../report.mjs";

const {
  Array: { isArray },
} = globalThis;

/* eslint-disable */
/**
 * @template X
 * @param {import("./tree").ArrayTree<X>} tree
 * @returns {Generator<X>}
 */
export const generateArrayTree = function* (tree) {
  /** @type {import("./tree").ArrayTree<X>[]} */
  const todo = [tree];
  let remain = 1;
  while (remain > 0) {
    const tree = todo[--remain];
    if (isArray(tree)) {
      for (let index = tree.length - 1; index >= 0; index--) {
        todo[remain++] = tree[index];
      }
    } else {
      yield tree;
    }
  }
};
/** eslint-disable */

/**
 * @type {import("./tree").Tree<never>}
 */
export const EMPTY_TREE = [""];

/* eslint-disable */
/**
 * @template X
 * @param {import("./tree").Tree<X>} tree
 * @returns {Generator<X>}
 */
export const generateLeaf = function* (tree) {
  /** @type {import("./tree").Tree<X>[]} */
  const todo = [tree];
  let remain = 1;
  while (remain > 0) {
    const tree = todo[--remain];
    const main_type = tree[0];
    const { length } = main_type;
    for (let index = 0; index < length; index++) {
      const type = /** @type {import("./tree").TreeType} */ (main_type[index]);
      const node = tree[index + 1];
      switch (type) {
        case "x": {
          yield /** @type {X} */ (node);
          break;
        }
        case "X": {
          yield* /** @type {X[]} */ (node);
          break;
        }
        case "t": {
          todo[remain++] = /** @type {import("./tree").Tree<X>} */ (node);
          break;
        }
        case "T": {
          const array = /** @type {import("./tree").Tree<X>[]} */ (node);
          const { length } = array;
          for (let index = 0; index < length; index += 1) {
            todo[remain++] = array[index];
          }
          break;
        }
        default: {
          throw new AranTypeError(type);
        }
      }
    }
  }
};
/* eslint-enable */

/* eslint-disable local/no-impure */
/**
 * @type {<X>(
 *   tree: import("./tree").Tree<X>,
 * ) => X[]}
 */
export const listTreeLeaf = (tree) => {
  const leafs = [];
  let length = 0;
  for (const leaf of generateLeaf(tree)) {
    leafs[length++] = leaf;
  }
  return leafs;
};
/* eslint-enable local/no-impure */

/**
 * @type {<X, Y extends X>(
 *   tree: import("./tree").Tree<X>,
 *   predicate: (leaf: X) => leaf is Y,
 * ) => Y | null}
 */
export const findTreeLeaf = (tree, predicate) => {
  for (const leaf of generateLeaf(tree)) {
    if (predicate(leaf)) {
      return leaf;
    }
  }
  return null;
};

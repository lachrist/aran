import { AranTypeError } from "../report.mjs";

/**
 * @type {import("./tree").Tree<never>}
 */
export const EMPTY_TREE = [""];

/* eslint-disable local/no-label */
/* eslint-disable local/no-impure */
/**
 * @template X
 * @param {import("./tree").Tree<X>} tree
 * @returns {X[]}
 */
export const listTreeLeaf = (tree) => {
  /** @type {X[]} */
  const leafs = [];
  let total = 0;
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
          leafs[total++] = /** @type {X} */ (node);
          break;
        }
        case "X": {
          const array = /** @type {X[]} */ (node);
          const { length } = array;
          for (let index = 0; index < length; index += 1) {
            leafs[total++] = array[index];
          }
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
  return leafs;
};
/* eslint-enable local/no-impure */
/* eslint-enable local/no-label */

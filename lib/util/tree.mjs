import { AranTypeError } from "../report.mjs";

/**
 * @type {import("./tree").Tree<never>}
 */
export const EMPTY_TREE = { type: "void" };

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
    switch (tree.type) {
      case "void": {
        break;
      }
      case "unary-leaf": {
        leafs[total++] = tree.leaf;
        break;
      }
      case "binary-leaf": {
        leafs[total++] = tree.leaf1;
        leafs[total++] = tree.leaf2;
        break;
      }
      case "ternary-leaf": {
        leafs[total++] = tree.leaf1;
        leafs[total++] = tree.leaf2;
        leafs[total++] = tree.leaf3;
        break;
      }
      case "multi-leaf": {
        const array = tree.leafs;
        const { length } = array;
        for (let index = 0; index < length; index++) {
          leafs[total++] = array[index];
        }
        break;
      }
      case "binary-node": {
        todo[remain++] = tree.branch1;
        todo[remain++] = tree.branch2;
        break;
      }
      case "ternary-node": {
        todo[remain++] = tree.branch1;
        todo[remain++] = tree.branch2;
        todo[remain++] = tree.branch3;
        break;
      }
      case "quaternary-node": {
        todo[remain++] = tree.branch1;
        todo[remain++] = tree.branch2;
        todo[remain++] = tree.branch3;
        todo[remain++] = tree.branch4;
        break;
      }
      case "multi-node": {
        const array = tree.branches;
        const { length } = array;
        for (let index = 0; index < length; index++) {
          todo[remain++] = array[index];
        }
        break;
      }
      default: {
        throw new AranTypeError(tree);
      }
    }
  }
  return leafs;
};
/* eslint-enable local/no-impure */
/* eslint-enable local/no-label */

/* eslint-disable local/no-impure */

const {
  Array: { isArray },
} = globalThis;

/**
 * @template X
 * @template {PropertyKey} K
 * @template V
 * @param {import("./tree").Tree<X>} tree
 * @param {(leaf: X) => K} getKey
 * @param {(leaf: X) => V} getVal
 * @returns {{ [key in K]?: V }}
 */
export const recordTree = (tree, getKey, getVal) => {
  /** @type {{ [key in K]?: V }} */
  const record = {
    // @ts-ignore
    __proto__: null,
  };
  const stack = [tree];
  let remain = stack.length;
  while (remain > 0) {
    const item = stack[--remain];
    if (isArray(item)) {
      for (let index = item.length - 1; index >= 0; index--) {
        stack[remain++] = item[index];
      }
    } else {
      record[getKey(item)] = getVal(item);
    }
  }
  return record;
};

/**
 * @type {<X>(
 *   tree: import("./tree").Tree<X>,
 * ) => boolean}
 */
export const isTreeEmpty = (tree) => {
  if (isArray(tree)) {
    const { length } = tree;
    for (let index = 0; index < length; index++) {
      if (!isTreeEmpty(tree[index])) {
        return false;
      }
    }
    return true;
  } else {
    return false;
  }
};

/**
 * @type {<X, Y>(
 *   tree: import("./tree").Tree<X>,
 *   transform: (leaf: X) => Y,
 * ) => Y[]}
 */
export const mapTree = (tree, transform) => {
  const leafs = [];
  let length = 0;
  const stack = [tree];
  let remain = stack.length;
  while (remain > 0) {
    const item = stack[--remain];
    if (isArray(item)) {
      for (let index = item.length - 1; index >= 0; index--) {
        stack[remain++] = item[index];
      }
    } else {
      leafs[length++] = transform(item);
    }
  }
  return leafs;
};

/**
 * @type {<X, Y extends X>(
 *   tree: import("./tree").Tree<X>,
 *   predicate: (leaf: X) => leaf is Y,
 * ) => Y[]}
 */
export const filterNarrowTree = (tree, predicate) => {
  const leafs = [];
  let length = 0;
  const stack = [tree];
  let remain = stack.length;
  while (remain > 0) {
    const item = stack[--remain];
    if (isArray(item)) {
      for (let index = item.length - 1; index >= 0; index--) {
        stack[remain++] = item[index];
      }
    } else {
      if (predicate(item)) {
        leafs[length++] = item;
      }
    }
  }
  return leafs;
};

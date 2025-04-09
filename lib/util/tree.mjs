/* eslint-disable local/no-impure */

const {
  Array: { isArray, from: toArray },
} = globalThis;

//////////
// size //
//////////

/**
 * @type {<X>(
 *   tree: import("./tree.d.ts").Tree<X>,
 * ) => boolean}
 */
export const isTreeEmpty = (tree) => {
  if (tree === null) {
    return true;
  } else if (isArray(tree)) {
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
 * @type {<X>(
 *   tree: import("./tree.d.ts").Tree<X>,
 * ) => number}
 */
export const getTreeSize = (tree) => {
  if (tree === null) {
    return 0;
  } else if (isArray(tree)) {
    let size = 0;
    const { length } = tree;
    for (let index = 0; index < length; index++) {
      size += getTreeSize(tree[index]);
    }
    return size;
  } else {
    return 1;
  }
};

////////////////////////
// forEachLeaf helper //
////////////////////////

/**
 * @type {<X>(
 *   tree: import("./tree.d.ts").Tree<X>,
 *   each: (leaf: X) => void,
 * ) => void}
 */
const forEachTree = (tree, each) => {
  if (tree !== null) {
    if (isArray(tree)) {
      const { length } = tree;
      for (let index = 0; index < length; index++) {
        forEachTree(tree[index], each);
      }
    } else {
      each(tree);
    }
  }
};

// Iterative forEachLeaf is marginally faster (< 5%).
// Let's not bother with it.

// {
//   /**
//    * @type {undefined[]}
//    */
//   const BUFFER = [
//     undefined,
//     undefined,
//     undefined,
//     undefined,
//     undefined,
//     undefined,
//     undefined,
//     undefined,
//   ];
//   /**
//    * @type {<X>(
//    *   tree: import("./tree.d.ts").Tree<X>,
//    *   each: (leaf: X) => void,
//    * ) => void}
//    */
//   const forEachLeafIterative = (tree, each) => {
//     const stack = toArray({
//       // @ts-ignore
//       __proto__: null,
//       length: 8,
//     });
//     stack[0] = tree;
//     let remain = 1;
//     let stack_length = stack.length;
//     while (remain > 0) {
//       const item = stack[--remain];
//       if (item !== null) {
//         if (isArray(item)) {
//           for (let index = item.length - 1; index >= 0; index--) {
//             if (remain >= stack_length) {
//               apply(push, stack, BUFFER);
//               stack_length = stack.length;
//             }
//             stack[remain++] = item[index];
//           }
//         } else {
//           each(item);
//         }
//       }
//     }
//   };
//   const makeBenchmarkTree = (depth, arity) => {
//     if (depth === 0) {
//       return 1;
//     } else {
//       return Array.from({ length: arity }, () =>
//         makeBenchmarkTree(depth - 1, arity),
//       );
//     }
//   };
//   const benchmark = (name, tree, forEachLeaf) => {
//     const time = performance.now();
//     let sum = 0;
//     forEachLeaf(tree, (leaf) => (sum += leaf));
//     const diff = performance.now(time);
//     console.log(name, diff, sum);
//   };
//   console.log("generating tree...");
//   const tree = makeBenchmarkTree(16, 3);
//   console.log("done generating tree");
//   // iterative 6529.260375 43046721
//   benchmark("iterative", tree, forEachLeaf1);
//   // recursive 6798.070167 43046721
//   benchmark("recursive", tree, forEachLeaf2);
// }

//////////////////////////
// forEachLeaf consumer //
//////////////////////////

/**
 * @template X
 * @template Y
 * @param {import("./tree.d.ts").Tree<X>} tree
 * @param {(accumulation: Y, leaf: X) => Y} accumulate
 * @param {Y} accumulation
 * @returns {Y}
 */
export const reduceTree = (tree, accumulate, accumulation) => {
  forEachTree(tree, (leaf) => {
    accumulation = accumulate(accumulation, leaf);
  });
  return accumulation;
};

/**
 * @template X
 * @param {import("./tree.d.ts").Tree<X>} tree
 * @returns {X[]}
 */
export const flatenTree = (tree) => {
  /** @type {X[]} */
  const leafs = toArray({
    // @ts-ignore
    __proto__: null,
    length: getTreeSize(tree),
  });
  let index = 0;
  forEachTree(tree, (leaf) => {
    leafs[index++] = leaf;
  });
  return leafs;
};

/**
 * @type {<X>(
 *   tree: import("./tree.d.ts").Tree<unknown>,
 *   leaf: X,
 * ) => boolean}
 */
export const hasTree = (tree, leaf) => {
  if (tree === null) {
    return false;
  } else if (isArray(tree)) {
    const { length } = tree;
    for (let index = 0; index < length; index++) {
      if (hasTree(tree[index], leaf)) {
        return true;
      }
    }
    return false;
  } else {
    return tree === leaf;
  }
};

/**
 * @template X
 * @template Y
 * @param {import("./tree.d.ts").Tree<X>} tree
 * @param {(leaf: X) => Y} transform
 * @returns {Y[]}
 */
export const mapTree = (tree, transform) => {
  /** @type {Y[]} */
  const leafs = toArray({
    // @ts-ignore
    __proto__: null,
    length: getTreeSize(tree),
  });
  let index = 0;
  forEachTree(tree, (leaf) => {
    leafs[index++] = transform(leaf);
  });
  return leafs;
};

/**
 * @template X
 * @template Y
 * @param {import("./tree.d.ts").Tree<X>} tree
 * @param {(leaf: X) => Y | null} transform
 * @returns {Y[]}
 */
export const filterMapTree = (tree, transform) => {
  /** @type {Y[]} */
  const leafs = toArray({
    // @ts-ignore
    __proto__: null,
    length: getTreeSize(tree),
  });
  let index = 0;
  forEachTree(tree, (leaf) => {
    const maybe_leaf = transform(leaf);
    if (maybe_leaf !== null) {
      leafs[index++] = maybe_leaf;
    }
  });
  leafs.length = index;
  return leafs;
};

/**
 * @template X
 * @template {PropertyKey} K
 * @template V
 * @param {import("./tree.d.ts").Tree<X>} tree
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
  forEachTree(tree, (leaf) => {
    record[getKey(leaf)] = getVal(leaf);
  });
  return record;
};

/**
 * @type {<X, Y extends X>(
 *   tree: import("./tree.d.ts").Tree<X>,
 *   predicate: (leaf: X) => leaf is Y,
 * ) => [Y[], Exclude<X, Y>[]]}
 */
export const splitTree = (tree, predicate) => {
  const leafs1 = toArray({
    // @ts-ignore
    __proto__: null,
    length: getTreeSize(tree),
  });
  let index1 = 0;
  const leafs2 = toArray({
    // @ts-ignore
    __proto__: null,
    length: getTreeSize(tree),
  });
  let index2 = 0;
  forEachTree(tree, (leaf) => {
    if (predicate(leaf)) {
      leafs1[index1++] = leaf;
    } else {
      leafs2[index2++] = leaf;
    }
  });
  leafs1.length = index1;
  leafs2.length = index2;
  return [leafs1, leafs2];
};

/**
 * @type {<X, Y extends X>(
 *   tree: import("./tree.d.ts").Tree<X>,
 *   predicate: (leaf: X) => leaf is Y,
 * ) => Y[]}
 */
export const filterNarrowTree = (tree, predicate) => {
  const leafs = toArray({
    // @ts-ignore
    __proto__: null,
    length: getTreeSize(tree),
  });
  let index = 0;
  forEachTree(tree, (leaf) => {
    if (predicate(leaf)) {
      leafs[index++] = leaf;
    }
  });
  leafs.length = index;
  return leafs;
};

export const filterTree = /**
 * @type {<X>(
 *   tree: import("./tree.d.ts").Tree<X>,
 *   predicate: (leaf: X) => boolean,
 * ) => X[]}
 */ (filterNarrowTree);

/**
 * @type {<X, Y extends X>(
 *   tree: import("./tree.d.ts").Tree<X>,
 *   predicate: (leaf: X) => leaf is Y,
 * ) => Y[]}
 */
export const filterOutNarrowTree = (tree, predicate) => {
  const leafs = toArray({
    // @ts-ignore
    __proto__: null,
    length: getTreeSize(tree),
  });
  let index = 0;
  forEachTree(tree, (leaf) => {
    if (!predicate(leaf)) {
      leafs[index++] = leaf;
    }
  });
  leafs.length = index;
  return leafs;
};

export const filterOutTree = /**
 * @type {<X>(
 *   tree: import("./tree.d.ts").Tree<X>,
 *   predicate: (leaf: X) => boolean,
 * ) => X[]}
 */ (filterOutNarrowTree);

/**
 * @type {<X, Y extends X>(
 *   tree: import("./tree.d.ts").Tree<X>,
 *   predicate: (leaf: X) => leaf is Y
 * ) => null | Y}
 */
export const findNarrowTree = (tree, predicate) => {
  if (tree === null) {
    return null;
  } else if (isArray(tree)) {
    const { length } = tree;
    for (let index = 0; index < length; index++) {
      const match = findNarrowTree(tree[index], predicate);
      if (match !== null) {
        return match;
      }
    }
    return null;
  } else {
    return predicate(tree) ? tree : null;
  }
};

/**
 * @type {<X, Y extends X>(
 *   tree: import("./tree.d.ts").Tree<X>,
 *   predicate: (leaf: X) => leaf is Y
 * ) => boolean}
 */
export const someTree = (tree, predicate) => {
  if (tree === null) {
    return false;
  } else if (isArray(tree)) {
    const { length } = tree;
    for (let index = 0; index < length; index++) {
      if (someTree(tree[index], predicate)) {
        return true;
      }
    }
    return false;
  } else {
    return predicate(tree);
  }
};

export const findTree = /**
 * @type {<X>(
 *   tree: import("./tree.d.ts").Tree<X>,
 *   predicate: (leaf: X) => boolean,
 * ) => X | null}
 */ (findNarrowTree);

/**
 * @type {<X, Y>(
 *   tree: import("./tree.d.ts").Tree<X>,
 *   lookup: (leaf: X) => null | Y
 * ) => null | Y}
 */
export const findMapTree = (tree, lookup) => {
  if (tree === null) {
    return null;
  } else if (isArray(tree)) {
    const { length } = tree;
    for (let index = 0; index < length; index++) {
      const match = findMapTree(tree[index], lookup);
      if (match !== null) {
        return match;
      }
    }
    return null;
  } else {
    return lookup(tree);
  }
};

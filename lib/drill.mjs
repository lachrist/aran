/* eslint-disable local/node-path */

import { mapIndex } from "./util/index.mjs";

/**
 * @template {object} N
 * @template {string} P
 * @template {string & keyof N} K
 * @param {{node: N, path: P}} pair
 * @param {K} key
 * @return {{node: N[K], path: P}}
 */
export const drill = ({ node, path }, key) => ({
  node: node[key],
  path: /** @type {P} */ (`${path}.${key}`),
});

/**
 * @template {object} N
 * @template {string} P
 * @template {string & keyof N} K
 * @param {{node: N, path: P}} pair
 * @param {K} key
 * @return {{nodes: N[K], path: P}}
 */
export const drillArray = ({ node, path }, key) => ({
  nodes: node[key],
  path: /** @type {P} */ (`${path}.${key}`),
});

/**
 * @template N
 * @template {string} P
 * @param {{nodes: N[], path: P}} pair
 * @return {{node: N, path: P}[]}
 */
export const drillAll = ({ nodes, path }) =>
  mapIndex(nodes.length, (index) => ({
    node: nodes[index],
    path: /** @type {P} */ (`${path}.${index}`),
  }));

/**
 * @template N
 * @template {string} P
 * @param {{nodes: N[], path: P}} pair
 * @param {number} index
 * @return {{node: N, path: P}}
 */
export const drillOne = ({ nodes, path }, index) => ({
  node: nodes[index],
  path: /** @type {P} */ (`${path}.${index}`),
});

// /**
//  * @template {string} P
//  * @template {string} K
//  * @template {object} N2
//  * @template {{[key in K]: N2}} N1
//  * @param {{node: N1, path: P}} pair
//  * @param {K} key
//  * @return {{node: N2, path: P}}
//  */
// export const drill = ({ node, path }, key) => ({
//   node: node[key],
//   path: /** @type {P} */ (`${path}.${key}`),
// });

// /**
//  * @template {string} P
//  * @template {string} K
//  * @template {object} N2
//  * @template {{[key in K]: N2[]}} N1
//  * @param {{node: N1, path: P}} pair
//  * @param {K} key
//  * @return {{node: N2, path: P}[]}
//  */
// export const drillArray = ({ node, path }, key) =>
//   mapIndex(node[key].length, (index) => ({
//     node: node[key][index],
//     path: /** @type {P} */ (`${path}.${key}.${index}`),
//   }));

// export const drillArray = ({ node, path }, key) =>
//   mapIndex(node[key].length, (index) => ({
//     node: node[key][index],
//     path: /** @type {P} */ (`${path}.${key}.${index}`),
//   }));

// Reflect.get;

// /**
//  * @template X
//  * @template {object} N
//  * @template {string} P
//  * @template {string & keyof N} K
//  * @template {N[K] & Array<X>} N2
//  * @param {{node: N, path: P}} pair
//  * @param {K} key
//  * @return {{node: X, path: P}[]}
//  */
// export const drillArray = ({ node, path }, key) =>
//   mapIndex(node[key].length, (index) => ({
//     node: node[key][index],
//     path: /** @type {P} */ (`${path}.${key}.${index}`),
//   }));

// /**
//  * @template {object} N
//  * @template {string} P
//  * @template {string & keyof N} K
//  * @param {{node: N, path: P}} pair
//  * @param {K} key
//  * @return {{node: N[K], path: P}}
//  */
// export const drill = ({ node, path }, key) => ({
//   node: node[key],
//   path: /** @type {P} */ (`${path}.${key}`),
// });

// /**
//  * @template {object} N
//  * @template {string} P
//  * @template {string & keyof N} K
//  * @param {{node: N, path: P}} pair
//  * @param {K} key
//  * @return {{node: N[K], path: P}}
//  */
// export const drillArray = ({ node, path }, key) => ({
//   node: node[key],
//   path: /** @type {P} */ (`${path}.${key}`),
// });

// import { mapIndex } from "./util/index.mjs";

// export const ROOT = "$";

// /**
//  * @template {string} P
//  * @param {P} path
//  * @param {string | number} key
//  * @return {P}
//  */
// export const append = (path, key) => /** @type {P} */ (`${path}.${key}`);

// /**
//  * @template {string} P
//  * @param {P} path
//  * @param {string | number} key1
//  * @param {string | number} key2
//  * @return {P}
//  */
// export const append2 = (path, key1, key2) =>
//   /** @type {P} */ (`${path}.${key1}.${key2}`);

// /**
//  * @template {string} P
//  * @param {P} path
//  * @param {string | number} key1
//  * @param {string | number} key2
//  * @param {string | number} key3
//  * @return {P}
//  */
// export const append3 = (path, key1, key2, key3) =>
//   /** @type {P} */ (`${path}.${key1}.${key2}.${key3}`);

// /**
//  * @template {string} P
//  * @param {P} path
//  * @param {string | number} key1
//  * @param {string | number} key2
//  * @param {string | number} key3
//  * @param {string | number} key4
//  * @return {P}
//  */
// export const append4 = (path, key1, key2, key3, key4) =>
//   /** @type {P} */ (`${path}.${key1}.${key2}.${key3}.${key4}`);

// /**
//  * @type {<
//  *   P extends string,
//  *   N extends object,
//  *   K extends (string & keyof N),
//  * >(
//  *   pair: {
//  *     node: N,
//  *     path: P,
//  *   },
//  *   key: K,
//  * ) => {
//  *   node: N[K],
//  *   path: P,
//  * }}
//  */
// export const drill = ({ node, path }, key) => ({
//   node: node[key],
//   path: append(path, key),
// });

// /**
//  * @type {<X, P extends string>(
//  *   pair: {
//  *     node: X[],
//  *     path: P,
//  *   },
//  *   index: number,
//  * ) => {
//  *   node: X,
//  *   path: P,
//  * }}
//  */
// export const drillArray = ({ node, path }, index) => ({
//   node: node[index],
//   path: append(path, index),
// });

// /**
//  * @type {<X, P extends string>(
//  *   pair: {
//  *     node: X[],
//  *     path: P,
//  *   },
//  * ) => {
//  *   node: X,
//  *   path: P,
//  * }[]}
//  */
// export const drillAll = ({ node, path }) =>
//   mapIndex(node.length, (index) => drillArray({ node, path }, index));

// // /**
// //  * @type {<X, P extends string, Y>(
// //  *   pair: {
// //  *     node: X[],
// //  *     path: P,
// //  *   },
// //  *   callback: (
// //  *     pair: {
// //  *       node: X,
// //  *       path: P,
// //  *     },
// //  *   ) => Y,
// //  * ) => Y[]}
// //  */
// // export const mapDrill = ({ node, path }, callback) =>
// //   mapIndex(node, (index) => callback(drillArray({ node, path }, index)));

// // /**
// //  * @type {<X, P extends string, Y>(
// //  *   pair: {
// //  *     node: X[],
// //  *     path: P,
// //  *   },
// //  *   callback: (
// //  *     pair: {
// //  *       node: X,
// //  *       path: P,
// //  *     },
// //  *   ) => Y[],
// //  * ) => Y[]}
// //  */
// // export const flatMapDrill = ({ node, path }, callback) =>
// //   flatMapIndex(node, (index) => callback(drillArray({ node, path }, index)));

import { forkMeta, nextMeta } from "./meta.mjs";

const { Array } = globalThis;

// /**
//  * @type {(
//  *   site: import("./site").Site<estree.Node>,
//  * ) => import("./site").VoidSite}
//  */
// export const emptySite = ({ path }) => ({ path });

// /**
//  * @type {<N>(
//  *   site: import("./site").Site<N>,
//  * ) => import("./site").Site<N>}
//  */
// export const forkSite = ({ node, path, meta }) => ({
//   node,
//   path,
//   meta: forkMeta(meta),
// });

// /**
//  * @type {<N>(
//  *   site: import("./site").Site<N>,
//  * ) => import("./site").Site<N>}
//  */
// export const nextSite = ({ node, path, meta }) => ({
//   node,
//   path,
//   meta: nextMeta(meta),
// });

// /**
//  * @type {<
//  *   N extends estree.Node,
//  *   O,
//  *   X,
//  *   S extends { [T in N["type"]]?: (
//  *     site: import("./site").Site<N & {
//  *       type: T,
//  *     }>,
//  *     scope: import("./scope").Scope,
//  *     options: O,
//  *   ) => X },
//  * >(
//  *   specific: S,
//  *   generic: (
//  *     site: import("./site").Site<N & {
//  *       type: Exclude<N["type"], keyof S>,
//  *     }>,
//  *     scope: import("./scope").Scope,
//  *     options: O,
//  *   ) => X,
//  * ) => (
//  *   site: import("./site").Site<N>,
//  *   scope: import("./scope").Scope,
//  *   options: O,
//  *  ) => X}
//  */
// export const dispatchSite = (specific, generic) => (site, scope, options) => {
//   if (hasOwn(specific, site.node.type)) {
//     // eslint-disable-next-line local/no-method-call
//     return /** @type {any} */ (specific)[site.node.type](site, scope, options);
//   } else {
//     return generic(/** @type {any} */ (site), scope, options);
//   }
// };

// /**
//  * @type {<N>(
//  *   site: import("./site").Site<N>,
//  * ) => import("./site").Site<N>}
//  */
// export const nextSite = ({ node, path, meta, pidx }) => ({
//   node,
//   path,
//   meta: /** @type {unbuild.Meta} */ (meta * primeAt(pidx)),
//   pidx,
// });

// /**
//  * @type {<N>(
//  *   site: import("./site").Site<N>,
//  * ) => import("./site").Site<N>}
//  */
// export const forkSite = ({ node, path, meta, pidx }) => ({
//   node,
//   path,
//   meta,
//   pidx: pidx + 1,
// });

/**
 * @type {<
 *  N,
 *  K extends keyof N & (string | number),
 * >(
 *  node: N,
 *  path: unbuild.Path,
 *  meta: import("./meta").Meta,
 *  key: K,
 * ) => import("./site").Site<N[K]>}
 */
export const drillSite = (node, path, meta, key) => ({
  node: node[key],
  path: /** @type {unbuild.Path} */ (`${path}.${key}`),
  meta,
});

/**
 * @type {<
 *  N,
 *  K1 extends keyof N & (string | number),
 *  K2 extends keyof N[K1] & (string | number)>(
 *  node: N,
 *  path: unbuild.Path,
 *  meta: import("./meta").Meta,
 *  key1: K1,
 *  key2: K2,
 * ) => import("./site").Site<N[K1][K2]>}
 */
export const drillDeepSite = (node, path, meta, key1, key2) => ({
  node: node[key1][key2],
  path: /** @type {unbuild.Path} */ (`${path}.${key1}.${key2}`),
  meta,
});

// /**
//  * @type {<N, K extends keyof N & (string | number)>(
//  *   site: import("./site").Site<N>,
//  *   key: K,
//  * ) => import("./site").Site<N[K]>}
//  */
// export const drillSite = ({ node, path, meta }, key) => ({
//   node: node[key],
//   path: /** @type {unbuild.Path} */ (`${path}.${key}`),
//   meta,
// });

/* eslint-disable local/no-impure */
/**
 * @type {<N>(
 *   site: import("./site").Site<N[]>,
 * ) => import("./site").Site<N>[]}
 */
export const drillSiteArray = ({ node: nodes, path, meta }) => {
  const { length } = nodes;
  const sites = new Array(length);
  for (let index = 0; index < length; index += 1) {
    // eslint-disable-next-line no-param-reassign
    sites[index] = {
      node: nodes[index],
      path: /** @type {unbuild.Path} */ (`${path}.${index}`),
      meta: forkMeta((meta = nextMeta(meta))),
    };
  }
  return sites;
};
/* eslint-enable local/no-impure */

/* eslint-disable local/no-impure */
// /**
//  * @type {<N, X>(
//  *   site: import("./site").Site<N>,
//  *   array: X[],
//  * ) => [import("./site").Site<N>, X][]}
//  */
// export const zipSite = (site, array) => {
//   const { length } = array;
//   const pairs = new Array(length);
//   for (let index = 0; index < length; index += 1) {
//     // eslint-disable-next-line no-param-reassign
//     pairs[index] = [forkSite((site = nextSite(site))), array[index]];
//   }
//   return pairs;
// };
/* eslint-enable local/no-impure */

//  let index = 1;
//  for (let key2 in node) {
//    if (
//      key2 !== "start" &&
//      key2 !== "end" &&
//      key2 !== "loc" &&
//      key2 !== "type"
//    ) {
//      if (key1 === key2) {
//        return {
//          node: node[key1],
//          path: /** @type {unbuild.Path} */ (`${path}.${key1}`),
//          meta: mangleMeta(meta, 2 * index),
//        };
//      }
//      index += 1;
//    }
//  }
//  throw new AranError("missing property");
// };

// /**
//  * @type {(
//  *   meta: { prime: bigint, product: bigint },
//  *   index: number,
//  * ) => bigint}
//  */
// const mangleMeta = ({ prime, product }, index) => ({
//   prime: nextPrime(prime),
//   product: product * prime ** Bigint(index),
// });

// /**
//  * @template N
//  * @template {keyof N & string} K
//  * @param {import("./site").Site<N>} site
//  * @param {K} key
//  * @return {import("./site").Site<N[K]>}
//  */

// /**
//  * @type {<N, K extends keyof N & string>(
//  *   site: import("./site").Site<N>,
//  *   key: K,
//  * ) => import("./site").Site<N[K]>}
//  */
// export const drillSite = ({ node, path, meta }, key1) => {
//   let index = 1;
//   for (let key2 in node) {
//     if (
//       key2 !== "start" &&
//       key2 !== "end" &&
//       key2 !== "loc" &&
//       key2 !== "type"
//     ) {
//       if (key1 === key2) {
//         return {
//           node: node[key1],
//           path: /** @type {unbuild.Path} */ (`${path}.${key1}`),
//           meta: mangleMeta(meta, 2 * index),
//         };
//       }
//       index += 1;
//     }
//   }
//   throw new AranError("missing property");
// };

// export const forkSite = ({ node, path, meta, pidx }, index) => ({
//   node,
//   path,
//   meta: meta * BigInt(primeAt(pidx) ** (2 * index + 1)),
//   pidx: pidx + 1,
// });

// //   node: node[key],
// //   path: /** @type {unbuild.Path} */ (`${path}.${key}`),
// //   meta: mangleMeta(meta, RECORD[node.type][key]),
// // });

// /**
//  * @type {<N>(
//  *   site: import("./site").Site<N[]>,
//  * ) => import("./site").Site<N>[]}
//  */
// export const drillAllSite = ({ node, path, meta }) => {
//   const { length } = node;
//   const result = new Array(length);
//   for (let index = 0; index < length; index += 1) {
//     result[index] = {
//       node: node[index],
//       path: /** @type {unbuild.Path} */ (`${path}.${index}`),
//       meta: mangleMeta(meta, index),
//     };
//   }
//   return result;
// };

// /**
//  * @type {<N>(
//  *   site: import("./site").Site<N[]>,
//  *   index: number,
//  * ) => import("./site").Site<N>}
//  */
// export const drillOneSite = ({ node, path, meta }, index) => ({
//   node: node[index],
//   path: /** @type {unbuild.Path} */ (`${path}.${index}`),
//   meta: mangleMeta(meta, index),
// });

// // meta /** @type {unbuild.Path} */,
// // let index = 1n;
// // for (const k in node) {
// //   if (k === key) {
// //     return {
// //       node: node[key],
// //       path: /** @type {unbuild.Path} */ (`${path}.${key}`),
// //       meta: meta * prime ** index,
// //       prime: nextPrime(prime),
// //     };
// //   }
// //   index += 1n;
// // }
// // throw new AranError("missing property");
// // const child = node[key];
// // const record = {__proto__: null};
// // for (const key in keys) {

// // }
// // return {
// //   node: child,
// //   path: /** @type {unbuild.Path} */ (`${path}.${key}`),
// //   meta: meta * prime ** keys[key],
// //   prime: nextPrime(prime),
// //   keys: listKey(child)
// // };

// /**
//  * @template N
//  * @template {keyof N & string} K
//  * @param {import("./site").Site<N>} site
//  * @param {K[]} keys
//  * @return {{[k in K]: import("./site").Site<N[k]>}}
//  */
// export const drill = ({ node, path, meta }, keys) => {
//   const { length } = keys;
//   if (length === 1) {
//     const key = keys[0];
//     return /** @type {any} */ ({
//       [key]: {
//         node: node[key],
//         path: /** @type {unbuild.Path} */ (`${path}.${key}`),
//         meta,
//       },
//     });
//   } else {
//     const metas = enumMeta(meta, length);
//     // ts shinaningan: inlining entries does not check...
//     const entries = mapIndex(length, (index) => {
//       const key = keys[index];
//       return [
//         key,
//         {
//           node: node[key],
//           path: /** @type {unbuild.Path} */ (`${path}.${key}`),
//           meta: metas[index],
//         },
//       ];
//     });
//     return reduceEntry(entries);
//   }
// };

// /**
//  * @template N
//  * @param {import("./site").Site<N[]>} site
//  * @return {import("./site").Site<N>[]}
//  */
// export const drillArray = ({ node, path, meta }) => {
//   const { length } = node;
//   if (length === 1) {
//     return [
//       {
//         node: node[0],
//         path: /** @type {unbuild.Path} */ (`${path}.0`),
//         meta,
//       },
//     ];
//   } else {
//     const metas = enumMeta(meta, length);
//     return mapIndex(length, (index) => ({
//       node: node[index],
//       path: /** @type {unbuild.Path} */ (`${path}.${index}`),
//       meta: metas[index],
//     }));
//   }
// };

// /**
//  * @type {<N>(
//  *   site: import("./site").Site<N>,
//  * ) => {
//  *   car: import("./site").Site<N>,
//  *   cdr: import("./site").Site<N>,
//  * }}
//  */
// export const splitSite = ({ node, path, meta }) => {
//   const [meta1, meta2] = enumMeta(meta, 2);
//   return {
//     car: { node, path, meta: meta1 },
//     cdr: { node, path, meta: meta2 },
//   };
// };

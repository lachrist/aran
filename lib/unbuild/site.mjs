import { enumMeta } from "./mangle.mjs";
import { mapIndex } from "../util/index.mjs";

const {
  Object: { fromEntries: reduceEntry },
} = globalThis;

/**
 * @template N
 * @typedef {{
 *   node: N,
 *   path: unbuild.Path,
 *   meta: unbuild.Meta,
 * }} Site
 */

/**
 * @template {estree.Node} N
 * @template {keyof N & string} K
 * @param {Site<N>} site
 * @param {K[]} keys
 * @return {{[k in K]: Site<N[k]>}}
 */
export const drill = ({ node, path, meta }, keys) => {
  const { length } = keys;
  if (length === 1) {
    const key = keys[0];
    return /** @type {any} */ ({
      [key]: {
        node: node[key],
        path: /** @type {unbuild.Path} */ (`${path}.${key}`),
        meta,
      },
    });
  } else {
    const metas = enumMeta(meta, length);
    // ts shinaningan: inlining entries does not check...
    const entries = mapIndex(length, (index) => {
      const key = keys[index];
      return [
        key,
        {
          node: node[key],
          path: /** @type {unbuild.Path} */ (`${path}.${key}`),
          meta: metas[index],
        },
      ];
    });
    return reduceEntry(entries);
  }
};

/**
 * @template {estree.Node} N
 * @param {Site<N[]>} site
 * @return {Site<N>[]}
 */
export const drillArray = ({ node, path, meta }) => {
  const { length } = node;
  if (length === 1) {
    return [
      {
        node: node[0],
        path: /** @type {unbuild.Path} */ (`${path}.0`),
        meta,
      },
    ];
  } else {
    const metas = enumMeta(meta, length);
    return mapIndex(length, (index) => ({
      node: node[index],
      path: /** @type {unbuild.Path} */ (`${path}.${index}`),
      meta: metas[index],
    }));
  }
};

// /**
//  * @type {(
//  *   site: Site<estree.Node>,
//  * ) => void}
//  */
// const yoyo = ({ node, path, meta }) => {
//   if (node.type === "ConditionalExpression") {
//     const x = yo({ node, path, meta }, ["test", "consequent", "alternate"]);
//   }
// };

// /**
//  * @template {estree.Node} N
//  * @param {Site<N>} site
//  * @param {(keyof N)[]} keys
//  * @return {{[K in keyof N]: {key: K, value: O[K]}}}
//  */
// const drill = ({ node, path, meta }, keys) => {
//   const res = {};
//   for (const key in obj) {
//     res[key] = { key, value: obj[key] };
//   }
//   return res;
// };

// /**
//  * @template {object} N
//  * @template {string} P
//  * @template {string & keyof N} K
//  * @param {{node: N, path: P}} pair
//  * @param {K} key
//  * @return {{node: N[K], path: P}}
//  */
// export const drill = ({ node, path, meta }, key) => ({
//   node: node[key],
//   path: /** @type {P} */ (`${path}.${key}`),
// });

// /**
//  * @template {object} N
//  * @template {string} P
//  * @template {string & keyof N} K
//  * @param {{node: N, path: P}} pair
//  * @param {K} key
//  * @return {{nodes: N[K], path: P}}
//  */
// export const drillArray = ({ node, path }, key) => ({
//   nodes: node[key],
//   path: /** @type {P} */ (`${path}.${key}`),
// });

// /**
//  * @template N
//  * @template {string} P
//  * @param {{nodes: N[], path: P}} pair
//  * @return {{node: N, path: P}[]}
//  */
// export const drillAll = ({ nodes, path }) =>
//   mapIndex(nodes.length, (index) => ({
//     node: nodes[index],
//     path: /** @type {P} */ (`${path}.${index}`),
//   }));

// /**
//  * @template N
//  * @template {string} P
//  * @param {{nodes: N[], path: P}} pair
//  * @param {number} index
//  * @return {{node: N, path: P}}
//  */
// export const drillOne = ({ nodes, path }, index) => ({
//   node: nodes[index],
//   path: /** @type {P} */ (`${path}.${index}`),
// });

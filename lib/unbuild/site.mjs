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
 * @template N
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
 * @template N
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

/**
 * @type {<N>(
 *   site: Site<N>,
 * ) => {car: Site<N>, cdr: Site<N>}}
 */
export const splitSite = ({ node, path, meta }) => {
  const [meta1, meta2] = enumMeta(meta, 2);
  return {
    car: { node, path, meta: meta1 },
    cdr: { node, path, meta: meta2 },
  };
};

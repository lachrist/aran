import { extendMeta } from "./mangle.mjs";
import { mapIndex } from "../util/index.mjs";

export const { Error } = globalThis;

/**
 * @template N
 * @typedef {{
 *   node: N,
 *   path: unbuild.Path,
 *   meta: unbuild.RootMeta,
 * }} Tip
 */

/**
 * @template NS
 * @typedef {{
 *   nodes: NS,
 *   path: unbuild.Path,
 *   meta: unbuild.RootMeta,
 * }} TipGroup
 */

/**
 * @type {<N, K extends Extract<keyof N, string>>(
 *   tip: Tip<N>,
 *   key: K,
 * ) => Tip<N[K]>}
 */
export const drill = ({ node, path, meta }, key) => {
  let index = 0;
  for (const current in node) {
    // eslint-disable-next-line local/no-impure
    index += 1;
    if (current === key) {
      return {
        node: node[key],
        path: /** @type {unbuild.Path} */ (`${path}.${key}`),
        meta: extendMeta(meta, index),
      };
    }
  }
  throw new Error("missing node key");
};

/**
 * @type {<N, K extends Extract<keyof N, string>>(
 *   tip: Tip<N>,
 *   key: K,
 * ) => TipGroup<N[K]>}
 */
export const drillArray = ({ node, path, meta }, key) => {
  let index = 0;
  for (const current in node) {
    // eslint-disable-next-line local/no-impure
    index += 1;
    if (current === key) {
      return {
        nodes: node[key],
        path: /** @type {unbuild.Path} */ (`${path}.${key}`),
        meta: extendMeta(meta, index),
      };
    }
  }
  throw new Error("missing node key");
};

/**
 * @type {<N>(
 *   curr: TipGroup<N[]>,
 * ) => Tip<N>[]}
 */
export const drillAll = ({ nodes, path, meta }) =>
  mapIndex(nodes.length, (index) => ({
    node: nodes[index],
    path: /** @type {unbuild.Path} */ (`${path}.${index}`),
    meta: extendMeta(meta, index),
  }));

/**
 * @type {<N>(
 *   curr: TipGroup<N[]>,
 *   index: number,
 * ) => Tip<N>}
 */
export const drillOne = ({ nodes, path, meta }, index) => ({
  node: nodes[index],
  path: /** @type {unbuild.Path} */ (`${path}.${index}`),
  meta: extendMeta(meta, index),
});

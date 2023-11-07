import { mapIndex } from "../util/index.mjs";

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

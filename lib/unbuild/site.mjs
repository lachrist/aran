import { joinDeepPath, joinPath, joinVeryDeepPath } from "../path.mjs";
import { forkMeta, nextMeta } from "./meta.mjs";

const { Array } = globalThis;

/**
 * @type {<
 *  N,
 *  K extends keyof N & import("../path").Segment,
 * >(
 *  node: N,
 *  path: import("../path").Path,
 *  meta: import("./meta").Meta,
 *  key: K,
 * ) => import("./site").Site<N[K]>}
 */
export const drillSite = (node, path, meta, key) => ({
  node: node[key],
  path: joinPath(path, key),
  meta,
});

/**
 * @type {<
 *   N,
 *   K1 extends keyof N & import("../path").Segment,
 *   K2 extends keyof N[K1] & import("../path").Segment,
 * >(
 *   node: N,
 *   path: import("../path").Path,
 *   meta: import("./meta").Meta,
 *   key1: K1,
 *   key2: K2,
 * ) => import("./site").Site<N[K1][K2]>}
 */
export const drillDeepSite = (node, path, meta, key1, key2) => ({
  node: node[key1][key2],
  path: joinDeepPath(path, key1, key2),
  meta,
});

/**
 * @type {<
 *   N,
 *   K1 extends keyof N & import("../path").Segment,
 *   K2 extends keyof N[K1] & import("../path").Segment,
 *   K3 extends keyof N[K1][K2] & import("../path").Segment,
 * >(
 *   node: N,
 *   path: import("../path").Path,
 *   meta: import("./meta").Meta,
 *   key1: K1,
 *   key2: K2,
 *   key3: K3,
 * ) => import("./site").Site<N[K1][K2][K3]>}
 */
export const drillVeryDeepSite = (node, path, meta, key1, key2, key3) => ({
  node: node[key1][key2][key3],
  path: joinVeryDeepPath(path, key1, key2, key3),
  meta,
});

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
    sites[index] = {
      node: nodes[index],
      path: joinPath(path, index),
      meta: forkMeta((meta = nextMeta(meta))),
    };
  }
  return sites;
};
/* eslint-enable local/no-impure */

/**
 * @type {<N>(
 *   site: import("./site").Site<N>,
 * ) => [
 *   import("./site").Site<N>,
 *   import("./site").Site<N>,
 * ]}
 */
export const duplicateSite = ({ node, path, meta }) => [
  {
    node,
    path,
    meta: forkMeta((meta = nextMeta(meta))),
  },
  {
    node,
    path,
    meta: forkMeta((meta = nextMeta(meta))),
  },
];

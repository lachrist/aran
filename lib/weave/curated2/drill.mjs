import { mapIndex } from "../../util/index.mjs";
import { joinTrail } from "./trail.mjs";

/**
 * @type {<
 *   N extends import("../atom").ArgNode,
 *   K extends keyof N & import("../../lang").NodeKey,
 * >(
 *   site: {
 *     node: N,
 *     trail: import("./trail").Trail,
 *   },
 *   key: K
 * ) => {
 *   node: N[K],
 *   trail: import("./trail").Trail
 * }}
 */
export const drill = ({ node, trail }, key) => ({
  node: node[key],
  trail: joinTrail(trail, key),
});

/**
 * @type {<
 *   N extends import("../atom").ArgNode,
 *   K extends keyof N & import("../../lang").NodeKey,
 * >(
 *   site: {
 *     node: N,
 *     trail: import("./trail").Trail,
 *   },
 *   key: K
 * ) => {
 *   nodes: N[K],
 *   trail: import("./trail").Trail
 * }}
 */
export const drillArray = ({ node, trail }, key) => ({
  nodes: node[key],
  trail: joinTrail(trail, key),
});

/**
 * @type {<
 *   N extends import("../atom").ArgNode,
 * >(
 *   site: {
 *     nodes: N[],
 *     trail: import("./trail").Trail,
 *   },
 * ) => {
 *   node: N,
 *   trail: import("./trail").Trail
 * }[]}
 */
export const drillAll = ({ nodes, trail }) =>
  mapIndex(nodes.length, (index) => ({
    node: nodes[index],
    trail: joinTrail(trail, index),
  }));

/**
 * @type {<
 *   N extends import("../atom").ArgNode,
 * >(
 *   site: {
 *     nodes: N[],
 *     trail: import("./trail").Trail,
 *   },
 *   index: number,
 * ) => {
 *   node: N,
 *   trail: import("./trail").Trail
 * }}
 */
export const drillOne = ({ nodes, trail }, index) => ({
  node: nodes[index],
  trail: joinTrail(trail, index),
});

import { mapIndex } from "../../util/index.mjs";
import { joinTrail } from "./trail.mjs";

/**
 * @type {<
 *   N extends aran.Node<import("../atom").ArgAtom>,
 *   K extends keyof N & aran.NodeKey
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
 *   N extends aran.Node<import("../atom").ArgAtom>,
 *   K extends keyof N & aran.NodeKey
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
 *   N extends aran.Node<import("../atom").ArgAtom>
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
 *   N extends aran.Node<import("../atom").ArgAtom>
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

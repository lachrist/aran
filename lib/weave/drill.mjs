import { mapIndex } from "../util/index.mjs";

/**
 * @type {{[key in aran.NodeKey]: string}}
 */
const shortcut = {
  alternate: "al",
  arguments: "ar",
  asynchronous: "as",
  body: "bo",
  callee: "cl",
  catch: "ct",
  code: "co",
  completion: "cp",
  consequent: "cs",
  delegate: "de",
  discard: "di",
  else: "el",
  export: "ex",
  finally: "fi",
  frame: "fr",
  generator: "ge",
  head: "he",
  import: "im",
  inner: "in",
  intrinsic: "ic",
  item: "it",
  label: "lb",
  labels: "ls",
  negative: "ng",
  positive: "ps",
  primitive: "pr",
  promise: "po",
  result: "re",
  sort: "st",
  source: "sc",
  tag: "tg",
  tail: "tl",
  test: "tt",
  then: "tn",
  this: "ts",
  try: "tr",
  type: "ty",
  value: "vl",
  variable: "vr",
};

/**
 * @type {<
 *   N extends aran.Node<weave.ArgAtom>,
 *   K extends keyof N & aran.NodeKey
 * >(
 *   site: {
 *     node: N,
 *     path: weave.TargetPath,
 *   },
 *   key: K
 * ) => {
 *   node: N[K],
 *   path: weave.TargetPath
 * }}
 */
export const drill = ({ node, path }, key) => ({
  node: node[key],
  path: /** @type {weave.TargetPath} */ (`${path}${shortcut[key]}`),
});

/**
 * @type {<
 *   N extends aran.Node<weave.ArgAtom>,
 *   K extends keyof N & aran.NodeKey
 * >(
 *   site: {
 *     node: N,
 *     path: weave.TargetPath,
 *   },
 *   key: K
 * ) => {
 *   nodes: N[K],
 *   path: weave.TargetPath
 * }}
 */
export const drillArray = ({ node, path }, key) => ({
  nodes: node[key],
  path: /** @type {weave.TargetPath} */ (`${path}${shortcut[key]}`),
});

/**
 * @type {<
 *   N extends aran.Node<weave.ArgAtom>
 * >(
 *   site: {
 *     nodes: N[],
 *     path: weave.TargetPath,
 *   },
 * ) => {
 *   node: N,
 *   path: weave.TargetPath
 * }[]}
 */
export const drillAll = ({ nodes, path }) =>
  mapIndex(nodes.length, (index) => ({
    node: nodes[index],
    path: /** @type {weave.TargetPath} */ (`${path}${index}`),
  }));

/**
 * @type {<
 *   N extends aran.Node<weave.ArgAtom>
 * >(
 *   site: {
 *     nodes: N[],
 *     path: weave.TargetPath,
 *   },
 *   index: number,
 * ) => {
 *   node: N,
 *   path: weave.TargetPath
 * }}
 */
export const drillOne = ({ nodes, path }, index) => ({
  node: nodes[index],
  path: /** @type {weave.TargetPath} */ (
    `${path}${index > 9 ? `$${index}` : index}`
  ),
});

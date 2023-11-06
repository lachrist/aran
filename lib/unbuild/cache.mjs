import { flat, map, unzip, zip } from "../util/index.mjs";
import { makeLongSequenceExpression } from "./intrinsic.mjs";
import { isMetaVariable, mangleMetaVariable, zipMeta } from "./mangle.mjs";
import {
  makeEffectStatement,
  makeExpressionEffect,
  makeReadExpression,
  makeSequenceExpression,
  makeWriteEffect,
} from "./node.mjs";

const {
  Object: { entries: listEntry, fromEntries: reduceEntry },
} = globalThis;

/**
 * @type {(
 *   node: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 *   meta: unbuild.Meta,
 * ) => [aran.Effect<unbuild.Atom>[], aran.Expression<unbuild.Atom>]}
 */
const cache = (node, path, meta) => {
  if (node.type === "ReadExpression" && isMetaVariable(node.variable)) {
    return [[], node];
  } else {
    const variable = mangleMetaVariable(meta);
    return [
      [makeWriteEffect(variable, node, true, path)],
      makeReadExpression(variable, path),
    ];
  }
};

/**
 * @type {(
 *   node: aran.Effect<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Effect<unbuild.Atom>}
 */
const forwardEffect = (node, _path) => node;

//////////////////////
// listImpureEffect //
//////////////////////

/**
 * @type {(
 *   node: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listImpureEffect = (node, path) => {
  if (node.type === "ReadExpression" && isMetaVariable(node.variable)) {
    return [];
  } else {
    return [makeExpressionEffect(node, path)];
  }
};

//////////
// Self //
//////////

/**
 * @type {(
 *   self: (
 *     pure: aran.Expression<unbuild.Atom>,
 *   ) => aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 *   meta: unbuild.Meta,
 *   kontinue: (
 *     pure: aran.Expression<unbuild.Atom>,
 *   ) => aran.Expression<unbuild.Atom>,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeSelfCacheExpression = (self, path, meta, kontinue) =>
  makeSequenceExpression(
    makeWriteEffect(
      mangleMetaVariable(meta),
      self(makeReadExpression(mangleMetaVariable(meta), path)),
      true,
      path,
    ),
    kontinue(makeReadExpression(mangleMetaVariable(meta), path)),
    path,
  );

////////////
// Single //
////////////

/**
 * @type {(
 *   node: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 *   meta: unbuild.Meta,
 *   kontinue: (
 *     pure: aran.Expression<unbuild.Atom>,
 *   ) => aran.Expression<unbuild.Atom>,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeCacheExpression = (node, path, meta, kontinue) => {
  const [body, tail] = cache(node, path, meta);
  return makeLongSequenceExpression(body, kontinue(tail), path);
};

/**
 * @type {(
 *   node: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 *   meta: unbuild.Meta,
 *   kontinue: (
 *     pure: aran.Expression<unbuild.Atom>,
 *   ) => [
 *     aran.Expression<unbuild.Atom>,
 *     aran.Expression<unbuild.Atom>,
 *   ],
 * ) => [
 *   aran.Expression<unbuild.Atom>,
 *   aran.Expression<unbuild.Atom>,
 * ]}
 */
export const makeCachePair = (node, path, meta, kontinue) => {
  const [body, tail] = cache(node, path, meta);
  const [fst, snd] = kontinue(tail);
  return [makeLongSequenceExpression(body, fst, path), snd];
};

/**
 * @type {<N>(
 *   node: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 *   meta: unbuild.Meta,
 *   wrapNode: (
 *     node: aran.Effect<unbuild.Atom>,
 *     path: unbuild.Path,
 *   ) => N,
 *   kontinue: (
 *     pure: aran.Expression<unbuild.Atom>,
 *   ) => N[],
 * ) => N[]}
 */
export const listCacheNode = (node, path, meta, wrapNode, kontinue) => {
  const [body, tail] = cache(node, path, meta);
  return [...map(body, (node) => wrapNode(node, path)), ...kontinue(tail)];
};

/**
 * @type {(
 *   node: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 *   meta: unbuild.Meta,
 *   kontinue: (
 *     pure: aran.Expression<unbuild.Atom>,
 *   ) => aran.Effect<unbuild.Atom>[],
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listCacheEffect = (node, path, meta, kontinue) =>
  listCacheNode(node, path, meta, forwardEffect, kontinue);

/**
 * @type {(
 *   node: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 *   meta: unbuild.Meta,
 *   kontinue: (
 *     pure: aran.Expression<unbuild.Atom>,
 *   ) => aran.Statement<unbuild.Atom>[],
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listCacheStatement = (node, path, meta, kontinue) =>
  listCacheNode(node, path, meta, makeEffectStatement, kontinue);

///////////
// Array //
///////////

/**
 * @type {(
 *   nodes: aran.Expression<unbuild.Atom>[],
 *   path: unbuild.Path,
 *   meta: unbuild.Meta,
 *   kontinue: (
 *     pures: aran.Expression<unbuild.Atom>[],
 *   ) => aran.Expression<unbuild.Atom>,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeArrayCacheExpression = (nodes, path, meta, kontinue) => {
  const [bodies, tails] = unzip(
    map(zipMeta(meta, nodes), ([meta, node]) => cache(node, path, meta)),
  );
  return makeLongSequenceExpression(flat(bodies), kontinue(tails), path);
};

/**
 * @type {<N>(
 *   node: aran.Expression<unbuild.Atom>[],
 *   path: unbuild.Path,
 *   meta: unbuild.Meta,
 *   wrapNode: (
 *     node: aran.Effect<unbuild.Atom>,
 *     path: unbuild.Path,
 *   ) => N,
 *   kontinue: (
 *     pures: aran.Expression<unbuild.Atom>[],
 *   ) => N[],
 * ) => N[]}
 */
export const listArrayCacheNode = (nodes, path, meta, wrapNode, kontinue) => {
  const [bodies, tails] = unzip(
    map(zipMeta(meta, nodes), ([meta, node]) => cache(node, path, meta)),
  );
  return [
    ...map(flat(bodies), (node) => wrapNode(node, path)),
    ...kontinue(tails),
  ];
};

/**
 * @type {(
 *   node: aran.Expression<unbuild.Atom>[],
 *   path: unbuild.Path,
 *   meta: unbuild.Meta,
 *   kontinue: (
 *     pures: aran.Expression<unbuild.Atom>[],
 *   ) => aran.Effect<unbuild.Atom>[],
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listArrayCacheEffect = (nodes, path, meta, kontinue) =>
  listArrayCacheNode(nodes, path, meta, forwardEffect, kontinue);

/**
 * @type {(
 *   node: aran.Expression<unbuild.Atom>[],
 *   path: unbuild.Path,
 *   meta: unbuild.Meta,
 *   kontinue: (
 *     pures: aran.Expression<unbuild.Atom>[],
 *   ) => aran.Statement<unbuild.Atom>[],
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listArrayCacheStatement = (nodes, path, meta, kontinue) =>
  listArrayCacheNode(nodes, path, meta, makeEffectStatement, kontinue);

////////////
// Record //
////////////

/**
 * @type {<K extends string>(
 *   record: {[key in K]: aran.Expression<unbuild.Atom>},
 *   path: unbuild.Path,
 *   meta: unbuild.Meta,
 *   kontinue: (
 *     pures: {[key in K]: aran.Expression<unbuild.Atom>},
 *   ) => aran.Expression<unbuild.Atom>,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeRecordCacheExpression = (record, path, meta, kontinue) => {
  const [names, nodes] = unzip(listEntry(record));
  return makeArrayCacheExpression(nodes, path, meta, (nodes) =>
    kontinue(/** @type {any} */ (reduceEntry(zip(names, nodes)))),
  );
};

/**
 * @type {<N, K extends string>(
 *   record: {[key in K]: aran.Expression<unbuild.Atom>},
 *   path: unbuild.Path,
 *   meta: unbuild.Meta,
 *   wrapNode: (
 *     node: aran.Effect<unbuild.Atom>,
 *     path: unbuild.Path,
 *   ) => N,
 *   kontinue: (
 *     pures: {[key in K]: aran.Expression<unbuild.Atom>},
 *   ) => N[],
 * ) => N[]}
 */
export const listRecordCacheNode = (record, path, meta, wrapNode, kontinue) => {
  const [names, nodes] = unzip(listEntry(record));
  return listArrayCacheNode(nodes, path, meta, wrapNode, (nodes) =>
    kontinue(/** @type {any} */ (reduceEntry(zip(names, nodes)))),
  );
};

/**
 * @type {<K extends string>(
 *   record: {[key in K]: aran.Expression<unbuild.Atom>},
 *   path: unbuild.Path,
 *   meta: unbuild.Meta,
 *   kontinue: (
 *     pures: {[key in K]: aran.Expression<unbuild.Atom>},
 *   ) => aran.Effect<unbuild.Atom>[],
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listRecordCacheEffect = (record, path, meta, kontinue) =>
  listRecordCacheNode(record, path, meta, forwardEffect, kontinue);

/**
 * @type {<K extends string>(
 *   record: {[key in K]: aran.Expression<unbuild.Atom>},
 *   path: unbuild.Path,
 *   meta: unbuild.Meta,
 *   kontinue: (
 *     pures: {[key in K]: aran.Expression<unbuild.Atom>},
 *   ) => aran.Statement<unbuild.Atom>[],
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listRecordCacheStatement = (record, path, meta, kontinue) =>
  listRecordCacheNode(record, path, meta, makeEffectStatement, kontinue);

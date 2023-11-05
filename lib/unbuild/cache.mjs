import {
  makeEffectStatement,
  makeExpressionEffect,
  makeReadExpression,
  makeSequenceExpression,
  makeWriteEffect,
} from "./node.mjs";

/**
 * @type {(
 *   node: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listImpureEffect = (node, path) =>
  node.type === "ReadExpression" ? [] : [makeExpressionEffect(node, path)];

/**
 * @type {(
 *   node: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 *   meta: unbuild.MetaVariable,
 *   kontinue: (
 *     pure: aran.Expression<unbuild.Atom>,
 *   ) => aran.Expression<unbuild.Atom>,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeCacheExpression = (node, path, meta, kontinue) =>
  node.type === "ReadExpression"
    ? kontinue(node)
    : makeSequenceExpression(
        makeWriteEffect(meta, node, true, path),
        kontinue(makeReadExpression(meta, path)),
        path,
      );

/**
 * @type {<N>(
 *   node: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 *   meta: unbuild.MetaVariable,
 *   wrapNode: (
 *     node: aran.Effect<unbuild.Atom>,
 *     path: unbuild.Path,
 *   ) => N,
 *   kontinue: (
 *     pure: aran.Expression<unbuild.Atom>,
 *   ) => N[],
 * ) => N[]}
 */
export const listCacheNode = (node, path, meta, wrapNode, kontinue) =>
  node.type === "ReadExpression"
    ? kontinue(node)
    : [
        wrapNode(makeWriteEffect(meta, node, true, path), path),
        ...kontinue(makeReadExpression(meta, path)),
      ];

/**
 * @type {(
 *   node: aran.Effect<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Effect<unbuild.Atom>}
 */
const forwardEffect = (node, _path) => node;

/**
 * @type {(
 *   node: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 *   meta: unbuild.MetaVariable,
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
 *   meta: unbuild.MetaVariable,
 *   kontinue: (
 *     pure: aran.Expression<unbuild.Atom>,
 *   ) => aran.Statement<unbuild.Atom>[],
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listCacheStatement = (node, path, meta, kontinue) =>
  listCacheNode(node, path, meta, makeEffectStatement, kontinue);

import {
  makeEffectStatement,
  makeExpressionEffect,
  makeReadExpression,
  makeSequenceExpression,
  makeWriteEffect,
} from "./node.mjs";

/**
 * @typedef {{
 *   var: aran.Parameter | unbuild.Variable,
 *   val: null | aran.Expression<unbuild.Atom>,
 * }} Cache
 */

/**
 * @typedef {{
 *   var: aran.Parameter | unbuild.Variable,
 *   val: null,
 * }} SavedCache
 */

/**
 * @type {(
 *   cache: Cache,
 *   path: unbuild.Path,
 *   kontinue: (cache: SavedCache) => aran.Expression<unbuild.Atom>,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeCacheSaveExpression = (cache, path, kontinue) =>
  cache.val === null
    ? kontinue(/** @type {SavedCache} */ (cache))
    : makeSequenceExpression(
        makeWriteEffect(cache.var, cache.val, true, path),
        kontinue({
          var: cache.var,
          val: null,
        }),
        path,
      );

/**
 * @type {(
 *   cache: Cache,
 *   path: unbuild.Path,
 *   kontinue: (cache: SavedCache) => aran.Effect<unbuild.Atom>[],
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listCacheSaveEffect = (cache, path, kontinue) =>
  cache.val === null
    ? kontinue(/** @type {SavedCache} */ (cache))
    : [
        makeWriteEffect(cache.var, cache.val, true, path),
        ...kontinue({
          var: cache.var,
          val: null,
        }),
      ];

/**
 * @type {(
 *   cache: Cache,
 *   path: unbuild.Path,
 *   kontinue: (cache: SavedCache) => aran.Statement<unbuild.Atom>[],
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listCacheSaveStatement = (cache, path, kontinue) =>
  cache.val === null
    ? kontinue(/** @type {SavedCache} */ (cache))
    : [
        makeEffectStatement(
          makeWriteEffect(cache.var, cache.val, true, path),
          path,
        ),
        ...kontinue({
          var: cache.var,
          val: null,
        }),
      ];

/**
 * @type {<N extends aran.Node<unbuild.Atom>>(
 *   cache: Cache,
 *   path: unbuild.Path,
 *   wrapNode: (
 *     effect: aran.Effect<unbuild.Atom>,
 *     path: unbuild.Path,
 *   ) => N,
 *   kontinue: (
 *     cache: SavedCache,
 *   ) => N[],
 * ) => N[]}
 */
export const listCacheSaveNode = (cache, path, wrapNode, kontinue) =>
  cache.val === null
    ? kontinue(/** @type {SavedCache} */ (cache))
    : [
        wrapNode(makeWriteEffect(cache.var, cache.val, true, path), path),
        ...kontinue({
          var: cache.var,
          val: null,
        }),
      ];

/**
 * @type {(
 *   cache: SavedCache,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeCacheLoadExpression = (cache, path) =>
  makeReadExpression(cache.var, path);

/**
 * @type {(
 *   cache: Cache,
 *   path: unbuild.Path
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeCacheTakeExpression = (cache, path) =>
  cache.val === null ? makeReadExpression(cache.var, path) : cache.val;

/**
 * @type {(
 *   cache: Cache,
 *   path: unbuild.Path
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listCacheTakeEffect = (cache, path) =>
  cache.val === null ? [] : [makeExpressionEffect(cache.val, path)];

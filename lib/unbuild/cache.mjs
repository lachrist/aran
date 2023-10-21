import {
  makeEffectStatement,
  makeExpressionEffect,
  makeReadExpression,
  makeSequenceExpression,
  makeWriteEffect,
} from "./node.mjs";

/**
 * @typedef {{
 *   var: null,
 *   val: aran.Expression<unbuild.Atom> & {
 *     type:
 *       | "ReadExpression"
 *       | "PrimitiveExpression"
 *       | "IntrinsicExpression",
 *   },
 * }} SavedCache
 */

/**
 * @typedef {SavedCache | {
 *   var: aran.Parameter | unbuild.Variable,
 *   val: aran.Expression<unbuild.Atom>,
 * }} Cache
 */

/**
 * @type {(
 *   cache: Cache,
 *   path: unbuild.Path,
 *   kontinue: (
 *     cache: SavedCache,
 *   ) => aran.Expression<unbuild.Atom>,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeCacheSaveExpression = (cache, path, kontinue) =>
  cache.var === null
    ? kontinue(cache)
    : cache.val.type === "ReadExpression" ||
      cache.val.type === "PrimitiveExpression" ||
      cache.val.type === "IntrinsicExpression"
    ? kontinue({
        var: null,
        val: cache.val,
      })
    : makeSequenceExpression(
        makeWriteEffect(cache.var, cache.val, true, path),
        kontinue({
          var: null,
          val: /** @type {aran.Expression<unbuild.Atom> & {type: "ReadExpression"}} */ (
            makeReadExpression(cache.var, path)
          ),
        }),
        path,
      );

/**
 * @type {(
 *   cache: Cache,
 *   path: unbuild.Path,
 *   kontinue: (
 *     cache: SavedCache,
 *   ) => aran.Effect<unbuild.Atom>[],
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listCacheSaveEffect = (cache, path, kontinue) =>
  cache.var === null
    ? kontinue(cache)
    : cache.val.type === "ReadExpression" ||
      cache.val.type === "PrimitiveExpression" ||
      cache.val.type === "IntrinsicExpression"
    ? kontinue({
        var: null,
        val: cache.val,
      })
    : [
        makeWriteEffect(cache.var, cache.val, true, path),
        ...kontinue({
          var: null,
          val: makeReadExpression(cache.var, path),
        }),
      ];

/**
 * @type {(
 *   cache: Cache,
 *   path: unbuild.Path,
 *   kontinue: (
 *     cache: SavedCache,
 *   ) => aran.Statement<unbuild.Atom>[],
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listCacheSaveStatement = (cache, path, kontinue) =>
  cache.var === null
    ? kontinue(cache)
    : cache.val.type === "ReadExpression" ||
      cache.val.type === "PrimitiveExpression" ||
      cache.val.type === "IntrinsicExpression"
    ? kontinue({
        var: null,
        val: cache.val,
      })
    : [
        makeEffectStatement(
          makeWriteEffect(cache.var, cache.val, true, path),
          path,
        ),
        ...kontinue({
          var: null,
          val: /** @type {aran.Expression<unbuild.Atom> & {type: "ReadExpression"}} */ (
            makeReadExpression(cache.var, path)
          ),
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
  cache.var === null
    ? kontinue(cache)
    : cache.val.type === "ReadExpression" ||
      cache.val.type === "PrimitiveExpression" ||
      cache.val.type === "IntrinsicExpression"
    ? kontinue({
        var: null,
        val: cache.val,
      })
    : [
        wrapNode(makeWriteEffect(cache.var, cache.val, true, path), path),
        ...kontinue({
          var: null,
          val: /** @type {aran.Expression<unbuild.Atom> & {type: "ReadExpression"}} */ (
            makeReadExpression(cache.var, path)
          ),
        }),
      ];

/**
 * @type {(
 *   cache: SavedCache,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeCacheLoadExpression = (cache, path) =>
  cache.val.type === "ReadExpression"
    ? makeReadExpression(cache.val.variable, path)
    : cache.val;

/**
 * @type {(
 *   cache: Cache,
 *   path: unbuild.Path
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeCacheTakeExpression = (cache, path) =>
  cache.val.type === "ReadExpression"
    ? makeReadExpression(cache.val.variable, path)
    : cache.val;

/**
 * @type {(
 *   cache: Cache,
 *   path: unbuild.Path
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listCacheTakeEffect = (cache, path) =>
  cache.val.type === "ReadExpression" ||
  cache.val.type === "PrimitiveExpression" ||
  cache.val.type === "IntrinsicExpression"
    ? []
    : [makeExpressionEffect(cache.val, path)];

import {
  makePrimitiveExpression,
  makeIntrinsicExpression,
  makeConditionalExpression,
  makeConditionalEffect,
  makeExpressionEffect,
} from "../node.mjs";

import {
  makeGetExpression,
  makeSetExpression,
  makeDeleteExpression,
  makeUnaryExpression,
  makeBinaryExpression,
} from "../intrinsic.mjs";
import { cacheConstant, makeReadCacheExpression } from "../cache.mjs";
import {
  bindSequence,
  sequenceExpression,
  zeroSequence,
} from "../sequence.mjs";

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   context: {},
 *   options: {
 *     frame: import("./dynamic.d.ts").DynamicFrame,
 *     variable: estree.Variable,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeDynamicExistExpression = (
  { path, meta },
  _context,
  { frame, variable },
) =>
  makeConditionalExpression(
    makeBinaryExpression(
      "in",
      makePrimitiveExpression(variable, path),
      makeReadCacheExpression(frame, path),
      path,
    ),
    sequenceExpression(
      bindSequence(
        cacheConstant(
          meta,
          makeGetExpression(
            makeReadCacheExpression(frame, path),
            makeIntrinsicExpression("Symbol.unscopables", path),
            path,
          ),
          path,
        ),
        (unscopables) =>
          zeroSequence(
            makeConditionalExpression(
              makeReadCacheExpression(unscopables, path),
              makeGetExpression(
                makeReadCacheExpression(unscopables, path),
                makePrimitiveExpression(variable, path),
                path,
              ),
              makePrimitiveExpression(true, path),
              path,
            ),
          ),
      ),
      path,
    ),
    makePrimitiveExpression(false, path),
    path,
  );

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   context: {},
 *   options: {
 *     frame: import("./dynamic.d.ts").DynamicFrame,
 *     variable: estree.Variable,
 *     alternate: aran.Expression<unbuild.Atom>,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeDynamicReadExpression = (
  { path, meta },
  context,
  { frame, variable, alternate },
) =>
  makeConditionalExpression(
    makeDynamicExistExpression({ meta, path }, context, { frame, variable }),
    makeGetExpression(
      makeReadCacheExpression(frame, path),
      makePrimitiveExpression(variable, path),
      path,
    ),
    alternate,
    path,
  );

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   context: {},
 *   options: {
 *     frame: import("../cache.js").Cache,
 *     variable: estree.Variable,
 *     alternate: aran.Expression<unbuild.Atom>,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeDynamicTypeofExpression = (
  { path, meta },
  context,
  { frame, variable, alternate },
) =>
  makeConditionalExpression(
    makeDynamicExistExpression({ meta, path }, context, { frame, variable }),
    makeUnaryExpression(
      "typeof",
      makeGetExpression(
        makeReadCacheExpression(frame, path),
        makePrimitiveExpression(variable, path),
        path,
      ),
      path,
    ),
    alternate,
    path,
  );

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   context: {
 *     mode: "strict" | "sloppy",
 *   },
 *   options: {
 *     frame: import("../cache.js").Cache,
 *     variable: estree.Variable,
 *     alternate: aran.Expression<unbuild.Atom>,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeDynamicDiscardExpression = (
  { path, meta },
  context,
  { frame, variable, alternate },
) =>
  makeConditionalExpression(
    makeDynamicExistExpression({ meta, path }, context, { frame, variable }),
    makeDeleteExpression(
      context.mode,
      makeReadCacheExpression(frame, path),
      makePrimitiveExpression(variable, path),
      path,
    ),
    alternate,
    path,
  );

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   context: {
 *     mode: "strict" | "sloppy",
 *   },
 *   options: {
 *     frame: import("./dynamic.d.ts").DynamicFrame,
 *     variable: estree.Variable,
 *     right: import("../cache.js").Cache,
 *     alternate: aran.Effect<unbuild.Atom>[],
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listDynamicWriteEffect = (
  { meta, path },
  context,
  { frame, variable, right, alternate },
) => [
  makeConditionalEffect(
    makeDynamicExistExpression({ meta, path }, context, { frame, variable }),
    [
      makeExpressionEffect(
        makeSetExpression(
          context.mode,
          makeReadCacheExpression(frame, path),
          makePrimitiveExpression(variable, path),
          makeReadCacheExpression(right, path),
          path,
        ),
        path,
      ),
    ],
    alternate,
    path,
  ),
];

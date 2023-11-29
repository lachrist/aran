import {
  makePrimitiveExpression,
  makeIntrinsicExpression,
  makeConditionalExpression,
  makeConditionalEffect,
  makeExpressionEffect,
} from "../../node.mjs";

import {
  makeGetExpression,
  makeSetExpression,
  makeDeleteExpression,
  makeUnaryExpression,
  makeBinaryExpression,
} from "../../intrinsic.mjs";
import { makeReadCacheExpression } from "../../cache.mjs";

/** @typedef {import("../../cache.d.ts").Cache} Cache */

/** @typedef {import("./dynamic.d.ts").DynamicFrame} DynamicFrame */

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {},
 *   options: {
 *     frame: DynamicFrame,
 *     variable: estree.Variable,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeWithExistExpression = ({ path }, _context, { frame, variable }) =>
  makeConditionalExpression(
    makeGetExpression(
      makeReadCacheExpression(frame, path),
      makeIntrinsicExpression("Symbol.unscopables", path),
      path,
    ),
    makeConditionalExpression(
      makeGetExpression(
        makeGetExpression(
          makeReadCacheExpression(frame, path),
          makeIntrinsicExpression("Symbol.unscopables", path),
          path,
        ),
        makePrimitiveExpression(variable, path),
        path,
      ),
      makePrimitiveExpression(false, path),
      makeBinaryExpression(
        "in",
        makePrimitiveExpression(variable, path),
        makeReadCacheExpression(frame, path),
        path,
      ),
      path,
    ),
    makeBinaryExpression(
      "in",
      makePrimitiveExpression(variable, path),
      makeReadCacheExpression(frame, path),
      path,
    ),
    path,
  );

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {},
 *   options: {
 *     frame: DynamicFrame,
 *     variable: estree.Variable,
 *     alternate: aran.Expression<unbuild.Atom>,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeWithReadExpression = (
  { path },
  context,
  { frame, variable, alternate },
) =>
  makeConditionalExpression(
    makeWithExistExpression({ path }, context, { frame, variable }),
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
 *   },
 *   context: {},
 *   options: {
 *     frame: import("../../cache.mjs").Cache,
 *     variable: estree.Variable,
 *     alternate: aran.Expression<unbuild.Atom>,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeWithTypeofExpression = (
  { path },
  context,
  { frame, variable, alternate },
) =>
  makeConditionalExpression(
    makeWithExistExpression({ path }, context, { frame, variable }),
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
 *   },
 *   context: {
 *     mode: "strict" | "sloppy",
 *   },
 *   options: {
 *     frame: import("../../cache.mjs").Cache,
 *     variable: estree.Variable,
 *     alternate: aran.Expression<unbuild.Atom>,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeWithDiscardExpression = (
  { path },
  context,
  { frame, variable, alternate },
) =>
  makeConditionalExpression(
    makeWithExistExpression({ path }, context, { frame, variable }),
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
 *   },
 *   context: {
 *     mode: "strict" | "sloppy",
 *   },
 *   options: {
 *     frame: DynamicFrame,
 *     variable: estree.Variable,
 *     right: Cache,
 *     alternate: aran.Effect<unbuild.Atom>[],
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listWithWriteEffect = (
  { path },
  context,
  { frame, variable, right, alternate },
) => [
  makeConditionalEffect(
    makeWithExistExpression({ path }, context, { frame, variable }),
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

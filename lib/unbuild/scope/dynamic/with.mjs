import {
  makePrimitiveExpression,
  makeIntrinsicExpression,
  makeConditionalExpression,
  makeConditionalEffect,
} from "../../node.mjs";

import {
  makeGetExpression,
  makeUnaryExpression,
  makeBinaryExpression,
} from "../../intrinsic.mjs";
import { cacheConstant, makeReadCacheExpression } from "../../cache.mjs";
import { mapSequence, sequenceExpression } from "../../sequence.mjs";
import { listSaveEffect, makeLoadExpression } from "../access.mjs";

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   frame: import(".").WithFrame,
 *   operation: {
 *     variable: estree.Variable,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeBindExpression = ({ path, meta }, frame, { variable }) =>
  makeConditionalExpression(
    makeBinaryExpression(
      "in",
      makePrimitiveExpression(variable, path),
      makeReadCacheExpression(frame.record, path),
      path,
    ),
    sequenceExpression(
      mapSequence(
        cacheConstant(
          meta,
          makeGetExpression(
            makeReadCacheExpression(frame.record, path),
            makeIntrinsicExpression("Symbol.unscopables", path),
            path,
          ),
          path,
        ),
        (unscopables) =>
          makeConditionalExpression(
            makeReadCacheExpression(unscopables, path),
            makeUnaryExpression(
              "!",
              makeGetExpression(
                makeReadCacheExpression(unscopables, path),
                makePrimitiveExpression(variable, path),
                path,
              ),
              path,
            ),
            makePrimitiveExpression(true, path),
            path,
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
 *   frame: import(".").WithFrame,
 *   operation: (
 *     | import("..").ReadOperation
 *     | import("..").TypeofOperation
 *     | import("..").DiscardOperation
 *   ),
 *   alternate: aran.Expression<unbuild.Atom>,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeWithLoadExpression = (
  { path, meta },
  frame,
  operation,
  alternate,
) =>
  makeConditionalExpression(
    makeBindExpression({ meta, path }, frame, operation),
    makeLoadExpression({ path }, frame.record, operation),
    alternate,
    path,
  );

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   frame: import(".").WithFrame,
 *   operation: import("..").WriteOperation,
 *   alternate: aran.Effect<unbuild.Atom>[],
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listWithSaveEffect = (
  { meta, path },
  frame,
  operation,
  alternate,
) => [
  makeConditionalEffect(
    makeBindExpression({ meta, path }, frame, operation),
    listSaveEffect({ path }, frame.record, operation),
    alternate,
    path,
  ),
];

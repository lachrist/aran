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
 *   context: {},
 *   options: {
 *     frame: import("../../cache.js").Cache,
 *     variable: estree.Variable,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeBindExpression = ({ path, meta }, _context, { frame, variable }) =>
  makeConditionalExpression(
    makeBinaryExpression(
      "in",
      makePrimitiveExpression(variable, path),
      makeReadCacheExpression(frame, path),
      path,
    ),
    sequenceExpression(
      mapSequence(
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
 *   context: {
 *     mode: "sloppy" | "strict",
 *   },
 *   options: {
 *     operation: "read" | "typeof" | "discard",
 *     frame: import("../../cache.js").Cache,
 *     variable: estree.Variable,
 *     alternate: aran.Expression<unbuild.Atom>,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeWithLoadExpression = (
  { path, meta },
  context,
  { operation, frame, variable, alternate },
) =>
  makeConditionalExpression(
    makeBindExpression({ meta, path }, context, {
      frame,
      variable,
    }),
    makeLoadExpression({ path }, context, {
      operation,
      frame,
      variable,
    }),
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
 *     operation: "write",
 *     frame: import("../../cache.js").Cache,
 *     variable: estree.Variable,
 *     right: import("../../cache.js").Cache | null,
 *     alternate: aran.Effect<unbuild.Atom>[],
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listWithSaveEffect = (
  { meta, path },
  context,
  { operation, frame, variable, right, alternate },
) => [
  makeConditionalEffect(
    makeBindExpression({ meta, path }, context, {
      frame,
      variable,
    }),
    right === null
      ? []
      : listSaveEffect({ path }, context, {
          mode: context.mode,
          frame,
          operation,
          variable,
          right,
        }),
    alternate,
    path,
  ),
];

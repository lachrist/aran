import { cacheConstant, makeReadCacheExpression } from "../../cache.mjs";
import { makeBinaryExpression } from "../../intrinsic.mjs";
import {
  makeConditionalEffect,
  makeConditionalExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "../../node.mjs";
import {
  listWriteAlienEffect,
  makeDiscardAlienExpression,
  makeReadAlienExpression,
  makeTypeofAlienExpression,
} from "../../param/index.mjs";
import {
  bindSequence,
  listenSequence,
  mapSequence,
  sequenceExpression,
  tellSequence,
} from "../../sequence.mjs";
import { makeThrowDeadzoneExpression } from "../error.mjs";

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
 *     situ: "local" | "global",
 *     variable: estree.Variable,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeAlienReadExpression = (
  { path, meta },
  context,
  { situ, variable },
) =>
  sequenceExpression(
    mapSequence(
      cacheConstant(
        meta,
        makeReadAlienExpression({ path }, context, { situ, variable }),
        path,
      ),
      (value) =>
        makeConditionalExpression(
          makeBinaryExpression(
            "===",
            makeReadCacheExpression(value, path),
            makeIntrinsicExpression("aran.deadzone", path),
            path,
          ),
          makeThrowDeadzoneExpression(variable, path),
          makeReadCacheExpression(value, path),
          path,
        ),
    ),
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
 *     situ: "local" | "global",
 *     variable: estree.Variable,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeAlienTypeofExpression = (
  { path },
  context,
  { situ, variable },
) =>
  makeConditionalExpression(
    makeBinaryExpression(
      "===",
      makeTypeofAlienExpression({ path }, context, { situ, variable }),
      makePrimitiveExpression("undefined", path),
      path,
    ),
    makePrimitiveExpression("undefined", path),
    makeConditionalExpression(
      makeBinaryExpression(
        "===",
        makeReadAlienExpression({ path }, context, { situ, variable }),
        makeIntrinsicExpression("aran.deadzone", path),
        path,
      ),
      makeThrowDeadzoneExpression(variable, path),
      makeTypeofAlienExpression({ path }, context, { situ, variable }),
      path,
    ),
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
 *     situ: "local" | "global",
 *     variable: estree.Variable,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeAlienDiscardExpression = makeDiscardAlienExpression;

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
 *     situ: "global" | "local",
 *     variable: estree.Variable,
 *     right: aran.Expression<unbuild.Atom>,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listAlienWriteEffect = (
  { path, meta },
  context,
  { situ, variable, right },
) =>
  // Hard to avoid triggering global accessors multiple times here.
  listenSequence(
    bindSequence(cacheConstant(meta, right, path), (right) =>
      tellSequence([
        makeConditionalEffect(
          makeBinaryExpression(
            "===",
            makeReadAlienExpression({ path }, context, { situ, variable }),
            makeIntrinsicExpression("aran.deadzone", path),
            path,
          ),
          [
            makeExpressionEffect(
              makeThrowDeadzoneExpression(variable, path),
              path,
            ),
          ],
          listWriteAlienEffect({ path }, context, {
            situ,
            variable,
            right: makeReadCacheExpression(right, path),
          }),
          path,
        ),
      ]),
    ),
  );

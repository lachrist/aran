import {
  makePrimitiveExpression,
  makeIntrinsicExpression,
  makeConditionalExpression,
} from "../../node.mjs";

import {
  makeGetExpression,
  makeSetExpression,
  makeDeleteExpression,
  makeUnaryExpression,
  makeBinaryExpression,
} from "../../intrinsic.mjs";
import { makeReadCacheExpression } from "../../cache.mjs";

/**
 * @type {(
 *   context: {},
 *   frame: import("../../cache.mjs").Cache,
 *   variable: estree.Variable,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeWithExistExpression = (_context, frame, variable, path) =>
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
 *   context: {},
 *   frame: import("../../cache.mjs").Cache,
 *   variable: estree.Variable,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeWithReadExpression = (_context, frame, variable, path) =>
  makeGetExpression(
    makeReadCacheExpression(frame, path),
    makePrimitiveExpression(variable, path),
    path,
  );

/**
 * @type {(
 *   context: {},
 *   frame: import("../../cache.mjs").Cache,
 *   variable: estree.Variable,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeWithTypeofExpression = (_context, frame, variable, path) =>
  makeUnaryExpression(
    "typeof",
    makeGetExpression(
      makeReadCacheExpression(frame, path),
      makePrimitiveExpression(variable, path),
      path,
    ),
    path,
  );

/**
 * @type {(
 *   context: {
 *     mode: "strict" | "sloppy",
 *   },
 *   frame: import("../../cache.mjs").Cache,
 *   variable: estree.Variable,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeWithDiscardExpression = ({ mode }, frame, variable, path) =>
  makeDeleteExpression(
    mode,
    makeReadCacheExpression(frame, path),
    makePrimitiveExpression(variable, path),
    path,
  );

/**
 * @type {(
 *   context: {
 *     mode: "strict" | "sloppy",
 *   },
 *   frame: import("../../cache.mjs").Cache,
 *   variable: estree.Variable,
 *   right: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeWithWriteExpression = (
  { mode },
  frame,
  variable,
  right,
  path,
) =>
  makeSetExpression(
    mode,
    makeReadCacheExpression(frame, path),
    makePrimitiveExpression(variable, path),
    right,
    path,
  );

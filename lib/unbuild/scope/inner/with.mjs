import {
  makePrimitiveExpression,
  makeIntrinsicExpression,
  makeConditionalExpression,
  makeReadExpression,
} from "../../node.mjs";

import {
  makeGetExpression,
  makeSetExpression,
  makeDeleteExpression,
  makeUnaryExpression,
  makeBinaryExpression,
} from "../../intrinsic.mjs";
import { makeTakeCacheExpression } from "../../cache.mjs";

/**
 * @type {(
 *   strict: boolean,
 *   frame: unbuild.Variable,
 *   variable: estree.Variable,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeWithExistExpression = (_strict, frame, variable, path) =>
  makeConditionalExpression(
    makeGetExpression(
      makeReadExpression(frame, path),
      makeIntrinsicExpression("Symbol.unscopables", path),
      path,
    ),
    makeConditionalExpression(
      makeGetExpression(
        makeGetExpression(
          makeReadExpression(frame, path),
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
        makeReadExpression(frame, path),
        path,
      ),
      path,
    ),
    makeBinaryExpression(
      "in",
      makePrimitiveExpression(variable, path),
      makeReadExpression(frame, path),
      path,
    ),
    path,
  );

/**
 * @type {(
 *   strict: boolean,
 *   frame: unbuild.Variable,
 *   variable: estree.Variable,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeWithReadExpression = (_strict, frame, variable, path) =>
  makeGetExpression(
    makeReadExpression(frame, path),
    makePrimitiveExpression(variable, path),
    path,
  );

/**
 * @type {(
 *   strict: boolean,
 *   frame: unbuild.Variable,
 *   variable: estree.Variable,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeWithTypeofExpression = (_strict, frame, variable, path) =>
  makeUnaryExpression(
    "typeof",
    makeGetExpression(
      makeReadExpression(frame, path),
      makePrimitiveExpression(variable, path),
      path,
    ),
    path,
  );

/**
 * @type {(
 *   strict: boolean,
 *   frame: unbuild.Variable,
 *   variable: estree.Variable,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeWithDiscardExpression = (strict, frame, variable, path) =>
  makeDeleteExpression(
    strict,
    makeReadExpression(frame, path),
    makePrimitiveExpression(variable, path),
    path,
  );

/**
 * @type {(
 *   strict: boolean,
 *   frame: unbuild.Variable,
 *   variable: estree.Variable,
 *   right: import("../../cache.mjs").Cache,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeWithWriteExpression = (strict, frame, variable, right, path) =>
  makeSetExpression(
    strict,
    makeReadExpression(frame, path),
    makePrimitiveExpression(variable, path),
    makeTakeCacheExpression(right, path),
    path,
  );

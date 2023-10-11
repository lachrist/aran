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

/**
 * @type {(
 *   strict: boolean,
 *   frame: unbuild.Variable,
 *   variable: estree.Variable,
 *   origin: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeWithExistExpression = (_strict, frame, variable, origin) =>
  makeConditionalExpression(
    makeGetExpression(
      makeReadExpression(frame, origin),
      makeIntrinsicExpression("Symbol.unscopables", origin),
      origin,
    ),
    makeConditionalExpression(
      makeGetExpression(
        makeGetExpression(
          makeReadExpression(frame, origin),
          makeIntrinsicExpression("Symbol.unscopables", origin),
          origin,
        ),
        makePrimitiveExpression(variable, origin),
        origin,
      ),
      makePrimitiveExpression(false, origin),
      makeBinaryExpression(
        "in",
        makePrimitiveExpression(variable, origin),
        makeReadExpression(frame, origin),
        origin,
      ),
      origin,
    ),
    makeBinaryExpression(
      "in",
      makePrimitiveExpression(variable, origin),
      makeReadExpression(frame, origin),
      origin,
    ),
    origin,
  );

/**
 * @type {(
 *   strict: boolean,
 *   frame: unbuild.Variable,
 *   variable: estree.Variable,
 *   origin: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeWithReadExpression = (_strict, frame, variable, origin) =>
  makeGetExpression(
    makeReadExpression(frame, origin),
    makePrimitiveExpression(variable, origin),
    origin,
  );

/**
 * @type {(
 *   strict: boolean,
 *   frame: unbuild.Variable,
 *   variable: estree.Variable,
 *   origin: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeWithTypeofExpression = (_strict, frame, variable, origin) =>
  makeUnaryExpression(
    "typeof",
    makeGetExpression(
      makeReadExpression(frame, origin),
      makePrimitiveExpression(variable, origin),
      origin,
    ),
    origin,
  );

/**
 * @type {(
 *   strict: boolean,
 *   frame: unbuild.Variable,
 *   variable: estree.Variable,
 *   origin: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeWithDiscardExpression = (strict, frame, variable, origin) =>
  makeDeleteExpression(
    strict,
    makeReadExpression(frame, origin),
    makePrimitiveExpression(variable, origin),
    origin,
  );

/**
 * @type {(
 *   strict: boolean,
 *   frame: unbuild.Variable,
 *   variable: estree.Variable,
 *   right: aran.Parameter | unbuild.Variable,
 *   origin: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeWithWriteExpression = (
  strict,
  frame,
  variable,
  right,
  origin,
) =>
  makeSetExpression(
    strict,
    makeReadExpression(frame, origin),
    makePrimitiveExpression(variable, origin),
    makeReadExpression(right, origin),
    origin,
  );

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
 * @type {<S>(
 *   strict: boolean,
 *   frame: unbuild.Variable,
 *   variable: estree.Variable,
 *   serial: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeWithExistExpression = (_strict, frame, variable, serial) =>
  makeConditionalExpression(
    makeGetExpression(
      makeReadExpression(frame, serial),
      makeIntrinsicExpression("Symbol.unscopables", serial),
      serial,
    ),
    makeConditionalExpression(
      makeGetExpression(
        makeGetExpression(
          makeReadExpression(frame, serial),
          makeIntrinsicExpression("Symbol.unscopables", serial),
          serial,
        ),
        makePrimitiveExpression(variable, serial),
        serial,
      ),
      makePrimitiveExpression(false, serial),
      makeBinaryExpression(
        "in",
        makePrimitiveExpression(variable, serial),
        makeReadExpression(frame, serial),
        serial,
      ),
      serial,
    ),
    makeBinaryExpression(
      "in",
      makePrimitiveExpression(variable, serial),
      makeReadExpression(frame, serial),
      serial,
    ),
    serial,
  );

/**
 * @type {<S>(
 *   strict: boolean,
 *   frame: unbuild.Variable,
 *   variable: estree.Variable,
 *   serial: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeWithReadExpression = (_strict, frame, variable, serial) =>
  makeGetExpression(
    makeReadExpression(frame, serial),
    makePrimitiveExpression(variable, serial),
    serial,
  );

/**
 * @type {<S>(
 *   strict: boolean,
 *   frame: unbuild.Variable,
 *   variable: estree.Variable,
 *   serial: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeWithTypeofExpression = (_strict, frame, variable, serial) =>
  makeUnaryExpression(
    "typeof",
    makeGetExpression(
      makeReadExpression(frame, serial),
      makePrimitiveExpression(variable, serial),
      serial,
    ),
    serial,
  );

/**
 * @type {<S>(
 *   strict: boolean,
 *   frame: unbuild.Variable,
 *   variable: estree.Variable,
 *   serial: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeWithDiscardExpression = (strict, frame, variable, serial) =>
  makeDeleteExpression(
    strict,
    makeReadExpression(frame, serial),
    makePrimitiveExpression(variable, serial),
    serial,
  );

/**
 * @type {<S>(
 *   strict: boolean,
 *   frame: unbuild.Variable,
 *   variable: estree.Variable,
 *   right: aran.Parameter | unbuild.Variable,
 *   serial: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeWithWriteExpression = (
  strict,
  frame,
  variable,
  right,
  serial,
) =>
  makeSetExpression(
    strict,
    makeReadExpression(frame, serial),
    makePrimitiveExpression(variable, serial),
    makeReadExpression(right, serial),
    serial,
  );

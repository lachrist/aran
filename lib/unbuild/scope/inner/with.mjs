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
 * @type {<T>(
 *   strict: boolean,
 *   frame: unbuild.Variable,
 *   variable: estree.Variable,
 *   tag: T,
 * ) => aran.Expression<unbuild.Atom<T>>}
 */
export const makeWithExistExpression = (_strict, frame, variable, tag) =>
  makeConditionalExpression(
    makeGetExpression(
      makeReadExpression(frame, tag),
      makeIntrinsicExpression("Symbol.unscopables", tag),
      tag,
    ),
    makeConditionalExpression(
      makeGetExpression(
        makeGetExpression(
          makeReadExpression(frame, tag),
          makeIntrinsicExpression("Symbol.unscopables", tag),
          tag,
        ),
        makePrimitiveExpression(variable, tag),
        tag,
      ),
      makePrimitiveExpression(false, tag),
      makeBinaryExpression(
        "in",
        makePrimitiveExpression(variable, tag),
        makeReadExpression(frame, tag),
        tag,
      ),
      tag,
    ),
    makeBinaryExpression(
      "in",
      makePrimitiveExpression(variable, tag),
      makeReadExpression(frame, tag),
      tag,
    ),
    tag,
  );

/**
 * @type {<T>(
 *   strict: boolean,
 *   frame: unbuild.Variable,
 *   variable: estree.Variable,
 *   tag: T,
 * ) => aran.Expression<unbuild.Atom<T>>}
 */
export const makeWithReadExpression = (_strict, frame, variable, tag) =>
  makeGetExpression(
    makeReadExpression(frame, tag),
    makePrimitiveExpression(variable, tag),
    tag,
  );

/**
 * @type {<T>(
 *   strict: boolean,
 *   frame: unbuild.Variable,
 *   variable: estree.Variable,
 *   tag: T,
 * ) => aran.Expression<unbuild.Atom<T>>}
 */
export const makeWithTypeofExpression = (_strict, frame, variable, tag) =>
  makeUnaryExpression(
    "typeof",
    makeGetExpression(
      makeReadExpression(frame, tag),
      makePrimitiveExpression(variable, tag),
      tag,
    ),
    tag,
  );

/**
 * @type {<T>(
 *   strict: boolean,
 *   frame: unbuild.Variable,
 *   variable: estree.Variable,
 *   tag: T,
 * ) => aran.Expression<unbuild.Atom<T>>}
 */
export const makeWithDiscardExpression = (strict, frame, variable, tag) =>
  makeDeleteExpression(
    strict,
    makeReadExpression(frame, tag),
    makePrimitiveExpression(variable, tag),
    tag,
  );

/**
 * @type {<T>(
 *   strict: boolean,
 *   frame: unbuild.Variable,
 *   variable: estree.Variable,
 *   right: aran.Parameter | unbuild.Variable,
 *   tag: T,
 * ) => aran.Expression<unbuild.Atom<T>>}
 */
export const makeWithWriteExpression = (strict, frame, variable, right, tag) =>
  makeSetExpression(
    strict,
    makeReadExpression(frame, tag),
    makePrimitiveExpression(variable, tag),
    makeReadExpression(right, tag),
    tag,
  );

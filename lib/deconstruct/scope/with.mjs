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

/**
 * @type {<T>(
 *   strict: boolean,
 *   pure: aran.Expression<unbuild.Atom<T>>,
 *   variable: estree.Variable,
 *   tag: T,
 * ) => aran.Expression<unbuild.Atom<T>>}
 */
export const makeWithExistExpression = (_strict, pure, variable, tag) =>
  makeConditionalExpression(
    makeGetExpression(
      pure,
      makeIntrinsicExpression("Symbol.unscopables", tag),
      tag,
    ),
    makeConditionalExpression(
      makeGetExpression(
        makeGetExpression(
          pure,
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
        pure,
        tag,
      ),
      tag,
    ),
    makeBinaryExpression(
      "in",
      makePrimitiveExpression(variable, tag),
      pure,
      tag,
    ),
    tag,
  );

/**
 * @type {<T>(
 *   strict: boolean,
 *   pure: aran.Expression<unbuild.Atom<T>>,
 *   variable: estree.Variable,
 *   tag: T,
 * ) => aran.Expression<unbuild.Atom<T>>}
 */
export const makeWithReadExpression = (_strict, pure, variable, tag) =>
  makeGetExpression(pure, makePrimitiveExpression(variable, tag), tag);

/**
 * @type {<T>(
 *   strict: boolean,
 *   pure: aran.Expression<unbuild.Atom<T>>,
 *   variable: estree.Variable,
 *   tag: T,
 * ) => aran.Expression<unbuild.Atom<T>>}
 */
export const makeWithTypeofExpression = (_strict, pure, variable, tag) =>
  makeUnaryExpression(
    "typeof",
    makeGetExpression(pure, makePrimitiveExpression(variable, tag), tag),
    tag,
  );

/**
 * @type {<T>(
 *   strict: boolean,
 *   pure: aran.Expression<unbuild.Atom<T>>,
 *   variable: estree.Variable,
 *   tag: T,
 * ) => aran.Expression<unbuild.Atom<T>>}
 */
export const makeWithDiscardExpression = (strict, pure, variable, tag) =>
  makeDeleteExpression(
    strict,
    pure,
    makePrimitiveExpression(variable, tag),
    tag,
  );

/**
 * @type {<T>(
 *   strict: boolean,
 *   pure: aran.Expression<unbuild.Atom<T>>,
 *   variable: estree.Variable,
 *   expression: aran.Expression<unbuild.Atom<T>>,
 *   tag: T,
 * ) => aran.Expression<unbuild.Atom<T>>}
 */
export const makeWithWriteExpression = (
  strict,
  pure,
  variable,
  expression,
  tag,
) =>
  makeSetExpression(
    strict,
    pure,
    makePrimitiveExpression(variable, tag),
    expression,
    tag,
  );

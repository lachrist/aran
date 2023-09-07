import {
  makePrimitiveExpression,
  makeIntrinsicExpression,
  makeConditionalExpression,
} from "../../syntax.mjs";

import {
  makeGetExpression,
  makeSetExpression,
  makeDeleteExpression,
  makeUnaryExpression,
  makeBinaryExpression,
} from "../../intrinsic.mjs";

/** @type {<T>(strict: boolean, pure: Expression<T>, variable: string, tag: T) => Expression<T>} */
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

/** @type {<T>(strict: boolean, pure: Expression<T>, variable: string, tag: T) => Expression<T>} */
export const makeWithReadExpression = (_strict, pure, variable, tag) =>
  makeGetExpression(pure, makePrimitiveExpression(variable, tag), tag);

/** @type {<T>(strict: boolean, pure: Expression<T>, variable: string, tag: T) => Expression<T>} */
export const makeWithTypeofExpression = (_strict, pure, variable, tag) =>
  makeUnaryExpression(
    "typeof",
    makeGetExpression(pure, makePrimitiveExpression(variable, tag), tag),
    tag,
  );

/**
 * @type {<T>(
 *   strict: boolean,
 *   pure: Expression<T>,
 *   variable: Variable,
 *   tag: T,
 * ) => Expression<T>}
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
 *   pure: Expression<T>,
 *   variable: Variable,
 *   expression: Expression<T>,
 *   tag: T,
 * ) => Expression<T>}
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

import {
  makePrimitiveExpression,
  makeIntrinsicExpression,
  makeConditionalExpression,
} from "../syntax.mjs";

import {
  makeGetExpression,
  makeSetExpression,
  makeDeleteExpression,
  makeUnaryExpression,
  makeBinaryExpression,
} from "../intrinsic.mjs";

/** @type {<T>(strict: boolean, pure: Expression<T>, variable: string) => Expression<T>} */
export const makeWithExistExpression = (_strict, pure, variable) =>
  makeConditionalExpression(
    makeGetExpression(pure, makeIntrinsicExpression("Symbol.unscopables")),
    makeConditionalExpression(
      makeGetExpression(
        makeGetExpression(pure, makeIntrinsicExpression("Symbol.unscopables")),
        makePrimitiveExpression(variable),
      ),
      makePrimitiveExpression(false),
      makeBinaryExpression("in", makePrimitiveExpression(variable), pure),
    ),
    makeBinaryExpression("in", makePrimitiveExpression(variable), pure),
  );

/** @type {<T>(strict: boolean, pure: Expression<T>, variable: string) => Expression<T>} */
export const makeWithReadExpression = (_strict, pure, variable) =>
  makeGetExpression(pure, makePrimitiveExpression(variable));

/** @type {<T>(strict: boolean, pure: Expression<T>, variable: string) => Expression<T>} */
export const makeWithTypeofExpression = (_strict, pure, variable) =>
  makeUnaryExpression(
    "typeof",
    makeGetExpression(pure, makePrimitiveExpression(variable)),
  );

/**
 * @type {<T>(
 *   strict: boolean,
 *   pure: Expression<T>,
 *   variable: string,
 * ) => Expression<T>}
 */
export const makeWithDiscardExpression = (strict, pure, variable) =>
  makeDeleteExpression(strict, pure, makePrimitiveExpression(variable));

/**
 * @type {<T>(
 *   strict: boolean,
 *   pure: Expression<T>,
 *   variable: string,
 *   expression: Expression<T>,
 * ) => Expression<T>}
 */
export const makeWithWriteExpression = (strict, pure, variable, expression) =>
  makeSetExpression(
    strict,
    pure,
    makePrimitiveExpression(variable),
    expression,
  );

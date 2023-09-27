import {
  makeLiteralExpression,
  makeIntrinsicExpression,
  makeConditionalExpression,
  makeBinaryExpression,
} from "../../ast/index.mjs";

import {
  makeGetExpression,
  makeSetExpression,
  makeDeleteExpression,
  makeUnaryExpression,
} from "../../intrinsic.mjs";

export const makeWithExistExpression = (pure, variable) =>
  makeConditionalExpression(
    makeGetExpression(pure, makeIntrinsicExpression("Symbol.unscopables")),
    makeConditionalExpression(
      makeGetExpression(
        makeGetExpression(pure, makeIntrinsicExpression("Symbol.unscopables")),
        makeLiteralExpression(variable),
      ),
      makeLiteralExpression(false),
      makeBinaryExpression("in", makeLiteralExpression(variable), pure),
    ),
    makeBinaryExpression("in", makeLiteralExpression(variable), pure),
  );

export const makeWithReadExpression = (pure, variable) =>
  makeGetExpression(pure, makeLiteralExpression(variable));

export const makeWithTypeofExpression = (pure, variable) =>
  makeUnaryExpression(
    "typeof",
    makeGetExpression(pure, makeLiteralExpression(variable)),
  );

export const makedWithDiscarExpression = (strict, pure, variable) =>
  makeDeleteExpression(strict, pure, makeLiteralExpression(variable));

export const makeWithWriteExpression = (strict, pure, variable, expression) =>
  makeSetExpression(strict, pure, makeLiteralExpression(variable), expression);

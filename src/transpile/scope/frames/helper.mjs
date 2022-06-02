import {partial_x} from "../../../util/index.mjs";

import {
  makeEffectStatement,
  makeExportEffect,
  makeLiteralExpression,
  makeSequenceEffect,
} from "../../../ast/index.mjs";

import {
  makeGetExpression,
  makeUnaryExpression,
  makeDeleteExpression,
  makeSetExpression,
  makeThrowReferenceErrorExpression,
  makeThrowTypeErrorExpression,
  makeThrowSyntaxErrorExpression,
} from "../../../intrinsic.mjs";

import {isRead, isTypeof, isDiscard, accessWrite} from "../right.mjs";

export const makeDynamicLookupExpression = (strict, object, key, right) => {
  if (isRead(right)) {
    return makeGetExpression(object, key);
  } else if (isTypeof(right)) {
    return makeUnaryExpression("typeof", makeGetExpression(object, key));
  } else if (isDiscard(right)) {
    return makeDeleteExpression(strict, object, key);
  } else {
    return makeSetExpression(strict, object, key, accessWrite(right));
  }
};

export const makeThrowDuplicateExpression = (variable) =>
  makeThrowSyntaxErrorExpression(
    `Variable '${variable}' has already been declared`,
  );

export const makeThrowMissingExpression = (variable) =>
  makeThrowReferenceErrorExpression(`Variable '${variable}' is not defined`);

export const makeThrowDeadzoneExpression = (variable) =>
  makeThrowReferenceErrorExpression(
    `Cannot access variable '${variable}' before initialization`,
  );

export const makeThrowConstantExpression = (variable) =>
  makeThrowTypeErrorExpression(
    `Cannot assign variable '${variable}' because it is a constant`,
  );

export const makeExportStatement = (specifier, expression) =>
  makeEffectStatement(makeExportEffect(specifier, expression));

export const makeExportUndefinedStatement = partial_x(
  makeExportStatement,
  makeLiteralExpression({undefined: null}),
);

export const makeExportSequenceEffect = (effect, specifier, expression) =>
  makeSequenceEffect(effect, makeExportEffect(specifier, expression));

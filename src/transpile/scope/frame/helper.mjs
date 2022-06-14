import {partial_x} from "../../../util/index.mjs";

import {
  makeEffectStatement,
  makeExportEffect,
  makeLiteralExpression,
  makeSequenceEffect,
  makeConditionalEffect,
  makeConditionalExpression,
} from "../../../ast/index.mjs";

import {
  makeThrowReferenceErrorExpression,
  makeThrowTypeErrorExpression,
  makeThrowSyntaxErrorExpression,
} from "../../../intrinsic.mjs";

////////////
// Lookup //
////////////

export const makeStaticLookupNode = (
  test,
  here,
  next,
  strict,
  escaped,
  frame,
  variable,
) => (test(frame, variable) ? here(strict, escaped, frame, variable) : next());

const generateLookupDynamicArray =
  (makeConditionalNode) =>
  (test, makeTestExpression, here, next, strict, escaped, frame, variable) =>
    test(frame, variable)
      ? here(strict, escaped, frame, variable)
      : makeConditionalNode(
          makeTestExpression(frame, variable),
          here(strict, escaped, frame, variable),
          next(),
        );

export const makeDynamicLookupExpression = generateLookupDynamicArray(
  makeConditionalExpression,
);

export const makeDynamicLookupEffect = generateLookupDynamicArray(
  makeConditionalEffect,
);

////////////
// Export //
////////////

export const makeExportStatement = (specifier, expression) =>
  makeEffectStatement(makeExportEffect(specifier, expression));

export const makeExportUndefinedStatement = partial_x(
  makeExportStatement,
  makeLiteralExpression({undefined: null}),
);

export const makeExportSequenceEffect = (effect, specifier, expression) =>
  makeSequenceEffect(effect, makeExportEffect(specifier, expression));

////////////
// Report //
////////////

export const DUPLICATE_TEMPLATE = "Variable '%s' has already been declared";

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

export const makeThrowDiscardExpression = (variable) =>
  makeThrowTypeErrorExpression(
    `Cannot discard variable '${variable}' because it is static`,
  );

export const makeThrowConstantExpression = (variable) =>
  makeThrowTypeErrorExpression(
    `Cannot assign variable '${variable}' because it is constant`,
  );

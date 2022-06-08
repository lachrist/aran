import {reduce} from "array-lite";

import {partial_x, partial__x, bind_____} from "../../../util/index.mjs";

import {
  makeWriteEffect,
  makeExpressionEffect,
  makeSequenceExpression,
  makeReadExpression,
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

import {makeVariable} from "../variable.mjs";

import {isWrite, isRead, isTypeof, isDiscard, accessWrite} from "../right.mjs";

/* eslint-disable no-use-before-define */

export const makeStaticLookupExpression = (
  strict,
  layer,
  variable,
  right,
  eexports,
) => {
  if (isRead(right)) {
    return makeReadExpression(makeVariable(layer, variable));
  } else if (isTypeof(right)) {
    return makeUnaryExpression(
      "typeof",
      makeReadExpression(makeVariable(layer, variable)),
    );
  } else if (isDiscard(right)) {
    return strict
      ? makeThrowTypeErrorExpression(
          `Cannot discard variable '${variable}' because it is static`,
        )
      : makeLiteralExpression(false);
  } else {
    return makeSequenceExpression(
      makeStaticLookupEffect(strict, layer, variable, right, eexports),
      makeLiteralExpression({undefined: null}),
    );
  }
};

export const makeStaticLookupEffect = (
  strict,
  layer,
  variable,
  right,
  eexports,
) => {
  if (isWrite(right)) {
    return reduce(
      eexports,
      partial__x(
        makeExportSequenceEffect,
        makeReadExpression(makeVariable(layer, variable)),
      ),
      makeWriteEffect(makeVariable(layer, variable), accessWrite(right)),
    );
  } else {
    return makeExpressionEffect(
      makeStaticLookupExpression(strict, layer, variable, right),
    );
  }
};

/* eslint-enable no-use-before-define */

export const makeDynamicLookupExpression = (
  strict,
  frame,
  variable,
  right,
  observed,
) => {
  if (isRead(right)) {
    return makeGetExpression(frame, makeLiteralExpression(variable));
  } else if (isTypeof(right)) {
    return makeUnaryExpression(
      "typeof",
      makeGetExpression(frame, makeLiteralExpression(variable)),
    );
  } else if (isDiscard(right)) {
    return makeDeleteExpression(strict, frame, makeLiteralExpression(variable));
  } else {
    if (observed) {
      accessWrite(right);
    }
    return makeSetExpression(
      strict,
      frame,
      makeLiteralExpression(variable),
      accessWrite(right),
    );
  }
};

export const makeDynamicLookupEffect = bind_____(
  makeExpressionEffect,
  makeDynamicLookupExpression,
);

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

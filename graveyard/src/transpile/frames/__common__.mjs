import { concat, map } from "array-lite";

import {
  partial_x,
  incrementCounter,
  SyntaxAranError,
  constant_,
  return__x___,
  constant__,
} from "../../util/index.mjs";

import {
  makeConditionalEffect,
  makeExpressionEffect,
  makeEffectStatement,
  makeExportEffect,
  makeLiteralExpression,
  makeWriteEffect,
  makeReadExpression,
  makeImportExpression,
} from "../../ast/index.mjs";

import {
  makeGetExpression,
  makeSetExpression,
  makeUnaryExpression,
  makeThrowReferenceErrorExpression,
  makeThrowTypeErrorExpression,
  makeThrowSyntaxErrorExpression,
} from "../../intrinsic.mjs";

const {
  undefined,
  JSON: { stringify: stringifyJSON },
} = globalThis;

export const makeConditionalEffectArray = (expression, effects1, effects2) => [
  makeConditionalEffect(expression, effects1, effects2),
];

////////////
// Export //
////////////

export const makeExportStatement = (specifier, expression) =>
  makeEffectStatement(makeExportEffect(specifier, expression));

export const makeExportUndefinedStatement = partial_x(
  makeExportStatement,
  makeLiteralExpression({ undefined: null }),
);

///////////////////
// Report Static //
///////////////////

export const DUPLICATE_TEMPLATE = "Variable %x has already been declared";

export const DuplicateError = SyntaxAranError;

////////////////////
// Report Dynamic //
////////////////////

export const makeThrowDuplicateExpression = (variable) =>
  makeThrowSyntaxErrorExpression(
    `Variable ${stringifyJSON(variable)} has already been declared`,
  );

export const makeThrowMissingExpression = (variable) =>
  makeThrowReferenceErrorExpression(
    `Variable ${stringifyJSON(variable)} is not defined`,
  );

export const makeThrowMissingEffectArray = (variable) => [
  makeExpressionEffect(
    makeThrowReferenceErrorExpression(
      `Variable ${stringifyJSON(variable)} is not defined`,
    ),
  ),
];

export const makeThrowDeadzoneExpression = (variable) =>
  makeThrowReferenceErrorExpression(
    `Cannot access variable ${stringifyJSON(variable)} before initialization`,
  );

export const makeThrowDeadzoneEffectArray = (variable) => [
  makeExpressionEffect(makeThrowDeadzoneExpression(variable)),
];

export const makeThrowDiscardExpression = (variable) =>
  makeThrowTypeErrorExpression(
    `Cannot discard variable ${stringifyJSON(variable)} because it is static`,
  );

export const makeThrowConstantExpression = (variable) =>
  makeThrowTypeErrorExpression(
    `Cannot assign variable ${stringifyJSON(variable)} because it is constant`,
  );

export const makeThrowConstantEffectArray = (variable) => [
  makeExpressionEffect(makeThrowConstantExpression(variable)),
];

///////////////////
// Lookup Static //
///////////////////

export const makeTypeofReadExpression = (variable) =>
  makeUnaryExpression("typeof", makeReadExpression(variable));

export const makeIncrementWriteEffectArray = (
  variable,
  { counter, expression },
) => {
  incrementCounter(counter);
  return [makeWriteEffect(variable, expression)];
};

export const makeExportIncrementWriteEffectArray = (
  variable,
  specifiers,
  options,
) =>
  concat(
    makeIncrementWriteEffectArray(variable, options),
    map(specifiers, partial_x(makeExportEffect, makeReadExpression(variable))),
  );

export const makeTypeofImportExpression = (source, specifier) =>
  makeUnaryExpression("typeof", makeImportExpression(source, specifier));

////////////////////
// Lookup Dynamic //
////////////////////

export const makeTypeofGetExpression = (expression1, expression2) =>
  makeUnaryExpression("typeof", makeGetExpression(expression1, expression2));

export const makeIncrementSetEffectArray = (
  strict,
  expression1,
  expression2,
  { counter, expression: expression3 },
) => {
  incrementCounter(counter);
  return [
    makeExpressionEffect(
      makeSetExpression(strict, expression1, expression2, expression3),
    ),
  ];
};

/////////////
// Default //
/////////////

export const createEmptyFrame = constant_({});
export const harvestEmptyFrameHeader = constant_([]);
export const harvestEmptyFramePrelude = constant_([]);
export const declareEmptyFrame = return__x___;
export const makeEmptyFrameInitializeStatementArray = return__x___;
export const lookupEmptyFrameAll = constant__(undefined);
export const makeEmptyFrameLookupNode = (
  makeScopeLookupNode,
  strict,
  _frame,
  scope,
  escaped,
  variable,
  options,
) => makeScopeLookupNode(strict, scope, escaped, variable, options);

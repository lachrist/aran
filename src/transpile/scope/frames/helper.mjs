import { reduce } from "array-lite";

import {
  partial__x,
  partial_x,
  incrementCounter,
  SyntaxAranError,
  constant_,
  return__x___,
  constant__,
} from "../../../util/index.mjs";

import {
  makeExpressionEffect,
  makeEffectStatement,
  makeSequenceEffect,
  makeExportEffect,
  makeLiteralExpression,
  makeWriteEffect,
  makeReadExpression,
  makeImportExpression,
} from "../../../ast/index.mjs";

import {
  makeGetExpression,
  makeSetExpression,
  makeUnaryExpression,
  makeThrowReferenceErrorExpression,
  makeThrowTypeErrorExpression,
  makeThrowSyntaxErrorExpression,
} from "../../../intrinsic.mjs";

const { undefined } = globalThis;

////////////
// Export //
////////////

export const makeExportStatement = (specifier, expression) =>
  makeEffectStatement(makeExportEffect(specifier, expression));

export const makeExportUndefinedStatement = partial_x(
  makeExportStatement,
  makeLiteralExpression({ undefined: null }),
);

export const makeExportSequenceEffect = (effect, specifier, expression) =>
  makeSequenceEffect(effect, makeExportEffect(specifier, expression));

///////////////////
// Report Static //
///////////////////

export const DUPLICATE_TEMPLATE = "Variable '%s' has already been declared";

export const DuplicateError = SyntaxAranError;

////////////////////
// Report Dynamic //
////////////////////

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

export const makeThrowDeadzoneEffect = (variable) =>
  makeExpressionEffect(makeThrowDeadzoneExpression(variable));

export const makeThrowDiscardExpression = (variable) =>
  makeThrowTypeErrorExpression(
    `Cannot discard variable '${variable}' because it is static`,
  );

export const makeThrowConstantExpression = (variable) =>
  makeThrowTypeErrorExpression(
    `Cannot assign variable '${variable}' because it is constant`,
  );

export const makeThrowConstantEffect = (variable) =>
  makeExpressionEffect(makeThrowConstantExpression(variable));

///////////////////
// Lookup Static //
///////////////////

export const makeTypeofReadExpression = (variable) =>
  makeUnaryExpression("typeof", makeReadExpression(variable));

export const makeIncrementWriteEffect = (variable, { counter, expression }) => {
  incrementCounter(counter);
  return makeWriteEffect(variable, expression);
};

export const makeExportIncrementWriteEffect = (variable, specifiers, options) =>
  reduce(
    specifiers,
    partial__x(makeExportSequenceEffect, makeReadExpression(variable)),
    makeIncrementWriteEffect(variable, options),
  );

export const makeTypeofImportExpression = (source, specifier) =>
  makeUnaryExpression("typeof", makeImportExpression(source, specifier));

////////////////////
// Lookup Dynamic //
////////////////////

export const makeTypeofGetExpression = (expression1, expression2) =>
  makeUnaryExpression("typeof", makeGetExpression(expression1, expression2));

export const makeIncrementSetEffect = (
  strict,
  expression1,
  expression2,
  { counter, expression: expression3 },
) => {
  incrementCounter(counter);
  return makeExpressionEffect(
    makeSetExpression(strict, expression1, expression2, expression3),
  );
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
const makeEmptyFrameLookupNode = (
  makeScopeLookupNode,
  strict,
  _frame,
  scope,
  escaped,
  variable,
  options,
) => makeScopeLookupNode(strict, scope, escaped, variable, options);
export const makeEmptyFrameReadExpression = makeEmptyFrameLookupNode;
export const makeEmptyFrameTypeofExpression = makeEmptyFrameLookupNode;
export const makeEmptyFrameDiscardExpression = makeEmptyFrameLookupNode;
export const makeEmptyFrameWriteEffect = makeEmptyFrameLookupNode;

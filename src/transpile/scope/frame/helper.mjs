import {
  assert,
  expect,
  partial_x,
  hasOwnProperty,
  incrementCounter,
  SyntaxAranError,
} from "../../../util/index.mjs";

import {
  makeExpressionEffect,
  makeEffectStatement,
  makeExportEffect,
  makeLiteralExpression,
  makeSequenceEffect,
  makeConditionalEffect,
  makeConditionalExpression,
  makeReadExpression,
  makeWriteEffect,
} from "../../../ast/index.mjs";

import {
  makeGetExpression,
  makeSetExpression,
  makeDeleteExpression,
  makeUnaryExpression,
  makeBinaryExpression,
  makeThrowReferenceErrorExpression,
  makeThrowTypeErrorExpression,
  makeThrowSyntaxErrorExpression,
} from "../../../intrinsic.mjs";

import {layerVariable} from "../variable.mjs";

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
  options,
) =>
  test(frame, variable)
    ? here(strict, escaped, frame, variable, options)
    : next();

const generateLookupDynamicArray =
  (makeConditionalNode) =>
  (
    test,
    makeTestExpression,
    here,
    next,
    strict,
    escaped,
    frame,
    variable,
    options,
  ) =>
    test(frame, variable, options)
      ? here(strict, escaped, frame, variable, options)
      : makeConditionalNode(
          makeTestExpression(frame, variable, options),
          here(strict, escaped, frame, variable, options),
          next(),
        );

export const makeDynamicLookupExpression = generateLookupDynamicArray(
  makeConditionalExpression,
);

export const makeDynamicLookupEffect = generateLookupDynamicArray(
  makeConditionalEffect,
);

////////////
// Static //
////////////

export const conflictStaticInternal = (
  _strict,
  {static: bindings},
  _kind,
  variable,
) => {
  assert(!hasOwnProperty(bindings, variable), "duplicate variable");
};

export const conflictStaticExternal = (
  _strict,
  {static: bindings},
  _kind,
  variable,
) => {
  expect(
    !hasOwnProperty(bindings, variable),
    SyntaxAranError,
    DUPLICATE_TEMPLATE,
    [variable],
  );
};

export const testStatic = ({static: bindings}, variable, _options) =>
  hasOwnProperty(bindings, variable);

export const makeStaticReadExpression = (
  _strict,
  _escaped,
  {layer},
  variable,
  _options,
) => makeReadExpression(layerVariable(layer, variable));

export const makeStaticTypeofExpression = (
  _strict,
  _escaped,
  {layer},
  variable,
  _options,
) =>
  makeUnaryExpression(
    "typeof",
    makeReadExpression(layerVariable(layer, variable)),
  );

export const makeStaticDiscardExpression = (
  strict,
  _escaped,
  _frame,
  variable,
  _options,
) =>
  strict ? makeThrowDiscardExpression(variable) : makeLiteralExpression(false);

export const makeStaticWriteEffect = (
  _strict,
  _escaped,
  {layer},
  variable,
  {expression, counter},
) => {
  incrementCounter(counter);
  return makeWriteEffect(layerVariable(layer, variable), expression);
};

/////////////
// Dynamic //
/////////////

export const makeDynamicTestExpression = ({dynamic}, variable, _options) =>
  makeBinaryExpression("in", makeLiteralExpression(variable), dynamic);

export const makeObservableDynamicTestExpression = (
  frame,
  variable,
  options,
) => {
  const {observable} = frame;
  if (observable) {
    const {counter} = options;
    incrementCounter(counter);
    incrementCounter(counter);
  }
  return makeDynamicTestExpression(frame, variable, options);
};

export const makeDynamicReadExpression = (
  _strict,
  _escaped,
  {dynamic},
  variable,
  _options,
) => makeGetExpression(dynamic, makeLiteralExpression(variable));

export const makeDynamicTypeofExpression = (
  _strict,
  _escaped,
  {dynamic},
  variable,
  _options,
) =>
  makeUnaryExpression(
    "typeof",
    makeGetExpression(dynamic, makeLiteralExpression(variable)),
  );

export const makeDynamicDiscardExpression = (
  strict,
  _escaped,
  {dynamic},
  variable,
  _options,
) => makeDeleteExpression(strict, dynamic, makeLiteralExpression(variable));

export const makeDynamicWriteEffect = (
  strict,
  _escaped,
  {dynamic},
  variable,
  {expression, counter},
) => {
  incrementCounter(counter);
  return makeExpressionEffect(
    makeSetExpression(
      strict,
      dynamic,
      makeLiteralExpression(variable),
      expression,
    ),
  );
};

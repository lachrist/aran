import {filter, map, concat} from "array-lite";

import {
  incrementCounter,
  expect,
  SyntaxAranError,
  hasOwnProperty,
  assert,
  bind_,
  partial_x,
  partialx_,
  partial____xx,
  partialxx_____,
  partialxxx____,
} from "../../../util/index.mjs";

import {
  makeConditionalExpression,
  makeConditionalEffect,
  makeEffectStatement,
  makeLiteralExpression,
  makeExpressionEffect,
  makeReadExpression as makeRawReadExpression,
  makeWriteEffect as makeRawWriteEffect,
} from "../../../ast/index.mjs";

import {makeUnaryExpression} from "../../../intrinsic.mjs";

import {layerVariable, layerShadowVariable} from "../variable.mjs";

import {
  DUPLICATE_TEMPLATE,
  makeThrowDeadzoneExpression,
  makeThrowDiscardExpression,
  makeThrowConstantExpression,
  makeExportStatement,
  makeStaticLookupNode,
} from "./helper.mjs";

const {
  Reflect: {ownKeys, defineProperty},
} = globalThis;

const hasDeadzone = (bindings, variable) => bindings[variable].deadzone;

const makeShadowInitializeStatement = (layer, variable) =>
  makeEffectStatement(
    makeRawWriteEffect(
      layerShadowVariable(layer, variable),
      makeLiteralExpression(false),
    ),
  );

const descriptor = {
  __proto__: null,
  value: null,
  configurable: true,
  enumerable: true,
  writable: true,
};

export const KINDS = ["let", "const", "class"];

export const create = (layer, {distant}) => ({
  layer,
  distant,
  bindings: {},
});

export const conflict = (_strict, {bindings}, _kind, variable) => {
  expect(
    !hasOwnProperty(bindings, variable),
    SyntaxAranError,
    DUPLICATE_TEMPLATE,
    [variable],
  );
};

export const harvest = ({layer, bindings}) => {
  const variables = ownKeys(bindings);
  const deadzone_variables = filter(
    variables,
    partialx_(hasDeadzone, bindings),
  );
  return {
    header: concat(
      map(variables, partialx_(layerVariable, layer)),
      map(deadzone_variables, partialx_(layerShadowVariable, layer)),
    ),
    prelude: map(
      deadzone_variables,
      partialx_(makeShadowInitializeStatement, layer),
    ),
  };
};

export const declare = (
  _strict,
  {bindings},
  kind,
  variable,
  {exports: eexports},
) => {
  assert(
    !hasOwnProperty(bindings, variable),
    "duplicate variable should have been caught by conflict",
  );
  defineProperty(bindings, variable, {
    __proto__: descriptor,
    value: {
      initialized: false,
      deadzone: false,
      writable: kind !== "const",
      exports: eexports,
    },
  });
};

export const makeInitializeStatementArray = (
  _strict,
  {layer, bindings, distant},
  _kind,
  variable,
  expression,
) => {
  assert(
    hasOwnProperty(bindings, variable),
    "missing variable for initialization",
  );
  const binding = bindings[variable];
  assert(!binding.initialized, "duplicate initialization");
  binding.initialized = true;
  return concat(
    [
      makeEffectStatement(
        makeRawWriteEffect(layerVariable(layer, variable), expression),
      ),
    ],
    binding.deadzone || distant
      ? [
          makeEffectStatement(
            makeRawWriteEffect(
              layerShadowVariable(layer, variable),
              makeLiteralExpression(true),
            ),
          ),
        ]
      : [],
    map(
      binding.exports,
      partial_x(
        makeExportStatement,
        makeRawReadExpression(layerVariable(layer, variable)),
      ),
    ),
  );
};

const test = ({bindings}, variable) => hasOwnProperty(bindings, variable);

const makeDeadzoneNode = (
  makeConditionalNode,
  live,
  dead,
  strict,
  escaped,
  {layer, distant, bindings},
  variable,
) => {
  const binding = bindings[variable];
  if (!binding.initialized && !escaped) {
    return dead(variable);
  } else if (binding.initialized && !distant) {
    return live(strict, layer, variable, binding.writable);
  } else {
    binding.deadzone = true;
    return makeConditionalNode(
      makeRawReadExpression(layerShadowVariable(layer, variable)),
      live(strict, layer, variable, binding.writable),
      dead(variable),
    );
  }
};

export const makeReadExpression = partialxx_____(
  makeStaticLookupNode,
  test,
  partialxxx____(
    makeDeadzoneNode,
    makeConditionalExpression,
    (_strict, layer, variable, _writable) =>
      makeRawReadExpression(layerVariable(layer, variable)),
    makeThrowDeadzoneExpression,
  ),
);

export const makeTypeofExpression = partialxx_____(
  makeStaticLookupNode,
  test,
  partialxxx____(
    makeDeadzoneNode,
    makeConditionalExpression,
    (_strict, layer, variable, _writable) =>
      makeUnaryExpression(
        "typeof",
        makeRawReadExpression(layerVariable(layer, variable)),
      ),
    makeThrowDeadzoneExpression,
  ),
);

export const makeDiscardExpression = partialxx_____(
  makeStaticLookupNode,
  test,
  (strict, _escaped, _frame, variable) =>
    strict
      ? makeThrowDiscardExpression(variable)
      : makeLiteralExpression(false),
);

const makeLiveWriteEffect = (
  _strict,
  layer,
  variable,
  writable,
  expression,
  counter,
) => {
  if (writable) {
    incrementCounter(counter);
    return makeRawWriteEffect(layerVariable(layer, variable), expression);
  } else {
    return makeExpressionEffect(makeThrowConstantExpression(variable));
  }
};

const makeDeadWriteEffect = bind_(
  makeExpressionEffect,
  makeThrowDeadzoneExpression,
);

export const makeWriteEffect = (
  next,
  strict,
  escaped,
  frame,
  variable,
  expression,
  counter,
) =>
  makeStaticLookupNode(
    test,
    partialxxx____(
      makeDeadzoneNode,
      makeConditionalEffect,
      partial____xx(makeLiveWriteEffect, expression, counter),
      makeDeadWriteEffect,
    ),
    next,
    strict,
    escaped,
    frame,
    variable,
  );

import {filter, map, concat} from "array-lite";

import {
  hasOwnProperty,
  assert,
  bind_,
  partial_x,
  partialx_,
  partialxx______,
} from "../../../util/index.mjs";

import {
  makeConditionalEffect,
  makeConditionalExpression,
  makeEffectStatement,
  makeLiteralExpression,
  makeExpressionEffect,
  makeReadExpression as makeRawReadExpression,
  makeWriteEffect as makeRawWriteEffect,
} from "../../../ast/index.mjs";

import {layerVariable, layerShadowVariable} from "../variable.mjs";

import {
  NULL_DATA_DESCRIPTOR,
  conflictStatic,
  testStatic,
  makeStaticReadExpression,
  makeStaticTypeofExpression,
  makeStaticDiscardExpression,
  makeStaticWriteEffect,
  makeThrowDeadzoneExpression,
  makeThrowConstantExpression,
  makeExportStatement,
  makeStaticLookupNode,
} from "./helper.mjs";

const {
  Reflect: {ownKeys, defineProperty},
} = globalThis;

export const KINDS = ["let", "const", "class"];

export const create = (layer, {distant}) => ({
  layer,
  distant,
  static: {},
});

const hasDeadzone = (bindings, variable) => bindings[variable].deadzone;

const makeShadowInitializeStatement = (layer, variable) =>
  makeEffectStatement(
    makeRawWriteEffect(
      layerShadowVariable(layer, variable),
      makeLiteralExpression(false),
    ),
  );

export const harvest = ({static: bindings, layer}) => {
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

export const conflict = conflictStatic;

export const declare = (
  _strict,
  {static: bindings},
  kind,
  variable,
  {exports: specifiers},
) => {
  assert(
    !hasOwnProperty(bindings, variable),
    "duplicate variable should have been caught by conflict",
  );
  defineProperty(bindings, variable, {
    __proto__: NULL_DATA_DESCRIPTOR,
    value: {
      initialized: false,
      deadzone: false,
      writable: kind !== "const",
      exports: specifiers,
    },
  });
};

export const makeInitializeStatementArray = (
  _strict,
  {static: bindings, layer, distant},
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

const generateMakeDeadzoneNode =
  (makeConditionalNode, makeDeadNode, makeLiveNode) =>
  (strict, escaped, frame, variable, options) => {
    const {static: bindings, distant, layer} = frame;
    const binding = bindings[variable];
    if (!binding.initialized && !escaped) {
      return makeDeadNode(variable);
    } else if (binding.initialized && !distant) {
      return makeLiveNode(strict, escaped, frame, variable, options);
    } else {
      binding.deadzone = true;
      return makeConditionalNode(
        makeRawReadExpression(layerShadowVariable(layer, variable)),
        makeLiveNode(strict, escaped, frame, variable, options),
        makeDeadNode(variable),
      );
    }
  };

export const makeReadExpression = partialxx______(
  makeStaticLookupNode,
  testStatic,
  generateMakeDeadzoneNode(
    makeConditionalExpression,
    makeThrowDeadzoneExpression,
    makeStaticReadExpression,
  ),
);

export const makeTypeofExpression = partialxx______(
  makeStaticLookupNode,
  testStatic,
  generateMakeDeadzoneNode(
    makeConditionalExpression,
    makeThrowDeadzoneExpression,
    makeStaticTypeofExpression,
  ),
);

export const makeDiscardExpression = partialxx______(
  makeStaticLookupNode,
  testStatic,
  makeStaticDiscardExpression,
);

export const makeWriteEffect = partialxx______(
  makeStaticLookupNode,
  testStatic,
  generateMakeDeadzoneNode(
    makeConditionalEffect,
    bind_(makeExpressionEffect, makeThrowDeadzoneExpression),
    (strict, escaped, frame, variable, options) => {
      const {static: bindings} = frame;
      return bindings[variable].writable
        ? makeStaticWriteEffect(strict, escaped, frame, variable, options)
        : makeExpressionEffect(makeThrowConstantExpression(variable));
    },
  ),
);

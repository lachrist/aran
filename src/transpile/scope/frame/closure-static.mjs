import {reduce, map} from "array-lite";

import {
  incrementCounter,
  constant_,
  partialx_,
  partial__x,
  partial____xx,
  partialxx_____,
  pushAll,
  assert,
  hasOwnProperty,
} from "../../../util/index.mjs";

import {
  makeEffectStatement,
  makeLiteralExpression,
  makeReadExpression as makeRawReadExpression,
  makeWriteEffect as makeRawWriteEffect,
} from "../../../ast/index.mjs";

import {makeUnaryExpression} from "../../../intrinsic.mjs";

import {layerVariable} from "../variable.mjs";

import {
  makeExportSequenceEffect,
  makeStaticLookupNode,
  makeThrowDiscardExpression,
} from "./helper.mjs";

const {
  undefined,
  Reflect: {ownKeys, defineProperty},
} = globalThis;

const descriptor = {
  __proto__: null,
  value: null,
  writable: false,
  enumerable: false,
  configurable: false,
};

const makeUpdateEffect = ({layer, bindings}, variable, expression) =>
  reduce(
    bindings[variable],
    partial__x(
      makeExportSequenceEffect,
      makeRawReadExpression(layerVariable(layer, variable)),
    ),
    makeRawWriteEffect(layerVariable(layer, variable), expression),
  );

export const KINDS = ["var", "function"];

export const create = (layer, _options) => ({
  layer,
  bindings: {},
});

export const conflict = constant_(undefined);

const makeDeclareStatement = (frame, variable) =>
  makeEffectStatement(
    makeUpdateEffect(frame, variable, makeLiteralExpression({undefined: null})),
  );

export const harvest = (frame) => {
  const {bindings, layer} = frame;
  const keys = ownKeys(bindings);
  return {
    header: map(keys, partialx_(layerVariable, layer)),
    prelude: map(keys, partialx_(makeDeclareStatement, frame)),
  };
};

export const declare = (
  _strict,
  {bindings},
  _kind,
  variable,
  {exports: eexports},
) => {
  if (!hasOwnProperty(bindings, variable)) {
    defineProperty(bindings, variable, {__proto__: descriptor, value: []});
  }
  pushAll(bindings[variable], eexports);
};

export const makeInitializeStatementArray = (
  _strict,
  frame,
  _kind,
  variable,
  expression,
) => {
  assert(
    hasOwnProperty(frame.bindings, variable),
    "missing variable for initialization",
  );
  return [makeEffectStatement(makeUpdateEffect(frame, variable, expression))];
};

const test = ({bindings}, variable) => hasOwnProperty(bindings, variable);

export const makeReadExpression = partialxx_____(
  makeStaticLookupNode,
  test,
  (_strict, _escaped, {layer}, variable) =>
    makeRawReadExpression(layerVariable(layer, variable)),
);

export const makeTypeofExpression = partialxx_____(
  makeStaticLookupNode,
  test,
  (_strict, _escaped, {layer}, variable) =>
    makeUnaryExpression(
      "typeof",
      makeRawReadExpression(layerVariable(layer, variable)),
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

const makeHitWriteEffect = (
  _strict,
  _escaped,
  frame,
  variable,
  expression,
  counter,
) => {
  incrementCounter(counter);
  return makeUpdateEffect(frame, variable, expression);
};

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
    partial____xx(makeHitWriteEffect, expression, counter),
    next,
    strict,
    escaped,
    frame,
    variable,
  );

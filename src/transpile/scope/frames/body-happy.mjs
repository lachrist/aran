import {map} from "array-lite";

import {partialx_, assert, hasOwnProperty} from "../../../util/index.mjs";

import {
  makeEffectStatement,
  makeWriteEffect,
  makeReadExpression,
  makeLiteralExpression,
} from "../../../ast/index.mjs";

import {makeUnaryExpression} from "../../../intrinsic.mjs";

import {makeVariable} from "../variable.mjs";

import {isRead, isTypeof, isDiscard, accessWrite} from "../right.mjs";

const {
  Reflect: {ownKeys, defineProperty},
} = globalThis;

const descriptor = {
  __proto__: null,
  value: false,
  writable: true,
  configurable: true,
  enumerable: true,
};

export const create = (layer, _options) => ({
  layer,
  bindings: {},
});

export const harvest = ({layer, bindings}) => ({
  header: map(ownKeys(bindings), partialx_(makeVariable, layer)),
  prelude: [],
});

export const declare = (
  {bindings},
  _strict,
  _kind,
  variable,
  import_,
  exports_,
) => {
  assert(import_ === null, "unexpected imported variable");
  assert(exports_.length === 0, "unexpected exported variable");
  assert(!hasOwnProperty(bindings, variable), "duplicate variable declaration");
  defineProperty(bindings, variable, descriptor);
  return [];
};

export const initialize = (
  {layer, bindings},
  _strict,
  _kind,
  variable,
  expression,
) => {
  assert(hasOwnProperty(bindings, variable), "missing variable declaration");
  assert(!bindings[variable], "duplicate variable initialization");
  bindings[variable] = true;
  return [
    makeEffectStatement(
      makeWriteEffect(makeVariable(layer, variable), expression),
    ),
  ];
};

export const lookup = (
  next,
  {layer, bindings},
  _escaped,
  _strict,
  variable,
  right,
) => {
  if (hasOwnProperty(bindings, variable)) {
    assert(bindings[variable], "missing variable initialization");
    if (isRead(right)) {
      return makeReadExpression(makeVariable(layer, variable));
    } else if (isTypeof(right)) {
      return makeUnaryExpression(
        "typeof",
        makeReadExpression(makeVariable(layer, variable)),
      );
    } else if (isDiscard(right)) {
      return makeLiteralExpression(false);
    } else {
      return makeWriteEffect(makeVariable(layer, variable), accessWrite(right));
    }
  } else {
    return next();
  }
};

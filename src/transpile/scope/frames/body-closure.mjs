import {concat, includes, map, reduce} from "array-lite";

import {
  partial_x,
  partial__x,
  pushAll,
  assert,
  hasOwnProperty,
} from "../../../util/index.mjs";

import {
  makeExportEffect,
  makeSequenceEffect,
  makeEffectStatement,
  makeWriteEffect,
  makeReadExpression,
  makeLiteralExpression,
} from "../../../ast/index.mjs";

import {makeUnaryExpression} from "../../../intrinsic.mjs";

import {isRead, isTypeof, isDiscard, accessWrite} from "../right.mjs";

const {
  Reflect: {ownKeys, defineProperty},
} = globalThis;

const kinds = ["var", "function"];

const descriptor = {
  __proto__: null,
  value: null,
  writable: false,
  enumerable: false,
  configurable: false,
};

export const create = (layer, _options) => ({
  layer,
  bindings: {},
});

export const harvest = ({bindings}) => ({
  header: ownKeys(bindings),
  prelude: [],
});

const makeExportStatement = (specifier, expression) =>
  makeEffectStatement(makeExportEffect(specifier, expression));

const makeExportUndefinedStatement = (specifier) =>
  makeEffectStatement(
    makeExportEffect(specifier, makeLiteralExpression({undefined: null})),
  );

const makeExportSequenceEffect = (effect, specifier, expression) =>
  makeSequenceEffect(effect, makeExportEffect(specifier, expression));

export const declare = (
  {layer, bindings},
  _strict,
  kind,
  variable,
  iimport,
  eexports,
) => {
  if (includes(kinds, kind)) {
    assert(iimport === null, "unexpected imported variable");
    variable = `${layer}${variable}`;
    if (!hasOwnProperty(bindings, variable)) {
      defineProperty(bindings, variable, {__proto__: descriptor, value: []});
    }
    pushAll(bindings[variable], eexports);
    return concat(
      [
        makeEffectStatement(
          makeWriteEffect(variable, makeLiteralExpression({undefined: null})),
        ),
      ],
      map(eexports, makeExportUndefinedStatement),
    );
  } else {
    return null;
  }
};

export const initialize = (
  {layer, bindings},
  _strict,
  kind,
  variable,
  expression,
) => {
  if (includes(kinds, kind)) {
    variable = `${layer}${variable}`;
    assert(
      hasOwnProperty(bindings, variable),
      "missing variable for initialization",
    );
    return concat(
      [makeEffectStatement(makeWriteEffect(variable, expression))],
      map(
        bindings[variable],
        partial_x(makeExportStatement, makeReadExpression(variable)),
      ),
    );
  } else {
    return null;
  }
};

export const lookup = (
  next,
  {layer, bindings},
  _strict,
  _escaped,
  variable,
  right,
) => {
  variable = `${layer}${variable}`;
  if (hasOwnProperty(bindings, variable)) {
    if (isRead(right)) {
      return makeReadExpression(variable);
    } else if (isTypeof(right)) {
      return makeUnaryExpression("typeof", makeReadExpression(variable));
    } else if (isDiscard(right)) {
      return makeLiteralExpression(false);
    } else {
      return reduce(
        bindings[variable],
        partial__x(makeExportSequenceEffect, makeReadExpression(variable)),
        makeWriteEffect(variable, accessWrite(right)),
      );
    }
  } else {
    return next();
  }
};

import {concat, includes, map, reduce} from "array-lite";

import {
  partialx_,
  partial_x,
  partial__x,
  pushAll,
  assert,
  hasOwnProperty,
} from "../../../util/index.mjs";

import {
  makeEffectStatement,
  makeWriteEffect,
  makeReadExpression,
  makeLiteralExpression,
} from "../../../ast/index.mjs";

import {makeUnaryExpression} from "../../../intrinsic.mjs";

import {makeVariable} from "../variable.mjs";

import {isRead, isTypeof, isDiscard, accessWrite} from "../right.mjs";

import {
  makeExportUndefinedStatement,
  makeExportStatement,
  makeExportSequenceEffect,
} from "./helper.mjs";

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

export const harvest = ({layer, bindings}) => ({
  header: map(ownKeys(bindings), partialx_(makeVariable, layer)),
  prelude: [],
});

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
    if (!hasOwnProperty(bindings, variable)) {
      defineProperty(bindings, variable, {__proto__: descriptor, value: []});
    }
    pushAll(bindings[variable], eexports);
    return concat(
      [
        makeEffectStatement(
          makeWriteEffect(
            makeVariable(layer, variable),
            makeLiteralExpression({undefined: null}),
          ),
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
    assert(
      hasOwnProperty(bindings, variable),
      "missing variable for initialization",
    );
    return concat(
      [
        makeEffectStatement(
          makeWriteEffect(makeVariable(layer, variable), expression),
        ),
      ],
      map(
        bindings[variable],
        partial_x(
          makeExportStatement,
          makeReadExpression(makeVariable(layer, variable)),
        ),
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
  if (hasOwnProperty(bindings, variable)) {
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
      return reduce(
        bindings[variable],
        partial__x(
          makeExportSequenceEffect,
          makeReadExpression(makeVariable(layer, variable)),
        ),
        makeWriteEffect(makeVariable(layer, variable), accessWrite(right)),
      );
    }
  } else {
    return next();
  }
};

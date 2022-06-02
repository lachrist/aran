import {concat, includes, map} from "array-lite";

import {
  partialx_,
  partial_x,
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

import {makeVariable} from "../variable.mjs";

import {
  makeStaticLookupEffect,
  makeStaticLookupExpression,
  makeExportUndefinedStatement,
  makeExportStatement,
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

export const makeDeclareStatements = (
  _strict,
  {layer, bindings},
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

export const makeInitializeStatements = (
  _strict,
  {layer, bindings},
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

const generateMakeLookupNode =
  (makeStaticLookupNode) =>
  (next, _escaped, strict, {layer, bindings}, variable, right) => {
    if (hasOwnProperty(bindings, variable)) {
      assert(bindings[variable], "missing variable initialization");
      return makeStaticLookupNode(
        strict,
        layer,
        variable,
        right,
        bindings[variable],
      );
    } else {
      return next();
    }
  };

export const makeLookupExpression = generateMakeLookupNode(
  makeStaticLookupExpression,
);

export const makeLookupEffect = generateMakeLookupNode(makeStaticLookupEffect);

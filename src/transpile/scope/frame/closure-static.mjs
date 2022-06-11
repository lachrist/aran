import {map} from "array-lite";

import {
  constant_,
  partialx_,
  pushAll,
  assert,
  hasOwnProperty,
} from "../../../util/index.mjs";

import {
  makeEffectStatement,
  makeLiteralExpression,
} from "../../../ast/index.mjs";

import {makeVariable} from "../variable.mjs";

import {makeWrite} from "../right.mjs";

import {makeStaticLookupEffect, makeStaticLookupExpression} from "./helper.mjs";

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

export const KINDS = ["var", "function"];

export const create = (layer, _options) => ({
  layer,
  bindings: {},
});

export const conflict = constant_(undefined);

export const harvest = ({layer, bindings}) => ({
  header: map(ownKeys(bindings), partialx_(makeVariable, layer)),
  prelude: [],
});

export const makeDeclareStatements = (
  strict,
  {layer, bindings},
  _kind,
  variable,
  {exports: eexports},
) => {
  if (!hasOwnProperty(bindings, variable)) {
    defineProperty(bindings, variable, {__proto__: descriptor, value: []});
  }
  pushAll(bindings[variable], eexports);
  return [
    makeEffectStatement(
      makeStaticLookupEffect(
        strict,
        layer,
        variable,
        makeWrite(makeLiteralExpression({undefined: null})),
        bindings[variable],
      ),
    ),
  ];
};

export const makeInitializeStatements = (
  strict,
  {layer, bindings},
  _kind,
  variable,
  expression,
) => {
  assert(
    hasOwnProperty(bindings, variable),
    "missing variable for initialization",
  );
  return [
    makeEffectStatement(
      makeStaticLookupEffect(
        strict,
        layer,
        variable,
        makeWrite(expression),
        bindings[variable],
      ),
    ),
  ];
};

const generateMakeLookupNode =
  (makeStaticLookupNode) =>
  (next, _escaped, strict, {layer, bindings}, variable, right) => {
    if (hasOwnProperty(bindings, variable)) {
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

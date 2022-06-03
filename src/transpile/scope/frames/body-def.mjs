import {map} from "array-lite";

import {partialx_, assert, hasOwnProperty} from "../../../util/index.mjs";

import {makeEffectStatement, makeWriteEffect} from "../../../ast/index.mjs";

import {makeVariable} from "../variable.mjs";

import {makeStaticLookupExpression, makeStaticLookupEffect} from "./helper.mjs";

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

export const KINDS = ["def"];

export const create = (layer, _options) => ({
  layer,
  bindings: {},
});

export const harvest = ({layer, bindings}) => ({
  header: map(ownKeys(bindings), partialx_(makeVariable, layer)),
  prelude: [],
});

export const makeDeclareStatements = (
  strict,
  {bindings},
  kind,
  variable,
  iimport,
  eexports,
) => {
  assert(iimport === null, "unexpected imported variable");
  assert(eexports.length === 0, "unexpected exported variable");
  assert(!hasOwnProperty(bindings, variable), "duplicate variable");
  defineProperty(bindings, variable, descriptor);
  return [];
};

export const makeInitializeStatements = (
  _strict,
  {layer, bindings},
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

const generateMakeLookupNode =
  (makeStaticLookupNode) =>
  (next, _escaped, strict, {layer, bindings}, variable, right) => {
    if (hasOwnProperty(bindings, variable)) {
      assert(bindings[variable], "missing variable initialization");
      return makeStaticLookupNode(strict, layer, variable, right, []);
    } else {
      return next();
    }
  };

export const makeLookupExpression = generateMakeLookupNode(
  makeStaticLookupExpression,
);

export const makeLookupEffect = generateMakeLookupNode(makeStaticLookupEffect);

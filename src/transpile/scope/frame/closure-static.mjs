import {map} from "array-lite";

import {
  constant_,
  deadcode_____,
  deadcode,
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

const dummy = deadcode("this should never happen");

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

export const makeDeclareStatements = (
  strict,
  frame,
  _kind,
  variable,
  iimport,
  eexports,
) => {
  assert(iimport === null, "unexpected imported variable");
  const {bindings} = frame;
  if (!hasOwnProperty(bindings, variable)) {
    defineProperty(bindings, variable, {__proto__: descriptor, value: []});
  }
  pushAll(bindings[variable], eexports);
  return [
    makeEffectStatement(
      makeLookupEffect(
        dummy,
        strict,
        false,
        frame,
        variable,
        makeWrite(makeLiteralExpression({undefined: null})),
      ),
    ),
  ];
};

export const makeInitializeStatements = deadcode_____(
  "var/function variables should not be initialized",
);

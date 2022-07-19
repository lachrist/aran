import {
  NULL_DATA_DESCRIPTOR,
  assert,
  constant_,
  constant___,
  bind_____,
  dropxxx_x,
  deadcode_____,
  partialxx______,
  hasOwnProperty,
} from "../../../util/index.mjs";

import {makeExpressionEffect} from "../../../ast/index.mjs";

import {makeUnaryExpression} from "../../../intrinsic.mjs";

import {
  makeStaticLookupNode,
  testStatic,
  conflictStaticInternal,
  makeStaticDiscardExpression,
  makeThrowConstantExpression,
} from "./helper.mjs";

const {
  undefined,
  Reflect: {defineProperty},
} = globalThis;

export const KINDS = ["macro"];

export const create = (_layer, _options) => ({static: {}});

export const conflict = conflictStaticInternal;

export const harvestHeader = constant_([]);

export const harvestPrelude = constant_([]);

export const declare = (
  _strict,
  {static: bindings},
  _kind,
  variable,
  {binding},
) => {
  assert(!hasOwnProperty(bindings, variable), "duplicate intrinsic variable");
  defineProperty(bindings, variable, {
    __proto__: NULL_DATA_DESCRIPTOR,
    value: binding,
  });
};

export const makeInitializeStatementArray = deadcode_____(
  "initialization on intrinsic frame",
);

export const lookupAll = constant___(undefined);

export const makeReadExpression = partialxx______(
  makeStaticLookupNode,
  testStatic,
  (_strict, _escaped, {static: bindings}, variable, _options) =>
    bindings[variable],
);

export const makeTypeofExpression = partialxx______(
  makeStaticLookupNode,
  testStatic,
  (_strict, _escaped, {static: bindings}, variable, _options) =>
    makeUnaryExpression("typeof", bindings[variable]),
);

export const makeDiscardExpression = partialxx______(
  makeStaticLookupNode,
  testStatic,
  makeStaticDiscardExpression,
);

export const makeWriteEffect = partialxx______(
  makeStaticLookupNode,
  testStatic,
  bind_____(makeExpressionEffect, dropxxx_x(makeThrowConstantExpression)),
);

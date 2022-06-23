import {includes, map} from "array-lite";

import {
  constant_,
  partialx_,
  partialxx______,
  assert,
  deadcode_____,
  constant___,
} from "../../../util/index.mjs";

import {layerVariable} from "../variable.mjs";

import {
  NULL_DATA_DESCRIPTOR,
  testStatic,
  conflictStaticInternal,
  makeStaticLookupNode,
  makeStaticReadExpression,
  makeStaticTypeofExpression,
  makeStaticDiscardExpression,
  makeStaticWriteEffect,
} from "./helper.mjs";

const {
  undefined,
  Reflect: {ownKeys, defineProperty},
} = globalThis;

export const KINDS = ["define"];

export const create = (layer, _options) => ({
  layer,
  static: {},
});

export const conflict = conflictStaticInternal;

export const harvestHeader = ({layer, static: bindings}) =>
  map(ownKeys(bindings), partialx_(layerVariable, layer));

export const harvestPrelude = constant_([]);

export const declare = (
  _strict,
  {static: bindings},
  _kind,
  variable,
  _options,
) => {
  assert(!includes(bindings, variable), "duplicate define variable");
  defineProperty(bindings, variable, NULL_DATA_DESCRIPTOR);
};

export const makeInitializeStatements = deadcode_____(
  "define variable should not be initialized",
);

export const lookupAll = constant___(undefined);

export const makeReadExpression = partialxx______(
  makeStaticLookupNode,
  testStatic,
  makeStaticReadExpression,
);

export const makeTypeofExpression = partialxx______(
  makeStaticLookupNode,
  testStatic,
  makeStaticTypeofExpression,
);

export const makeDiscardExpression = partialxx______(
  makeStaticLookupNode,
  testStatic,
  makeStaticDiscardExpression,
);

export const makeWriteEffect = partialxx______(
  makeStaticLookupNode,
  testStatic,
  makeStaticWriteEffect,
);

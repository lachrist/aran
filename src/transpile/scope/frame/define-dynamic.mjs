import {
  NULL_DATA_DESCRIPTOR,
  hasOwnProperty,
  constant_,
  deadcode_____,
  partialxxx______,
  assert,
  constant___,
} from "../../../util/index.mjs";

import {
  testStatic,
  conflictStaticInternal,
  makeDynamicLookupExpression,
  makeDynamicLookupEffect,
  makeObservableDynamicTestExpression,
  makeDynamicTestExpression,
  makeDynamicReadExpression,
  makeDynamicTypeofExpression,
  makeDynamicDiscardExpression,
  makeDynamicWriteEffect,
} from "./helper.mjs";

const {
  undefined,
  Reflect: {defineProperty},
} = globalThis;

export const KINDS = ["define"];

export const create = (_layer, {macro, observable}) => ({
  dynamic: macro,
  static: {},
  observable,
});

export const conflict = conflictStaticInternal;

export const harvestHeader = constant_([]);

export const harvestPrelude = constant_([]);

export const declare = (
  _strict,
  {static: bindings},
  _kind,
  variable,
  _options,
) => {
  assert(!hasOwnProperty(bindings, variable), "duplicate define variable");
  defineProperty(bindings, variable, NULL_DATA_DESCRIPTOR);
};

export const makeInitializeStatementArray = deadcode_____(
  "define variable should not be initialized",
);

export const lookupAll = constant___(undefined);

export const makeReadExpression = partialxxx______(
  makeDynamicLookupExpression,
  testStatic,
  makeDynamicTestExpression,
  makeDynamicReadExpression,
);

export const makeTypeofExpression = partialxxx______(
  makeDynamicLookupExpression,
  testStatic,
  makeDynamicTestExpression,
  makeDynamicTypeofExpression,
);

export const makeDiscardExpression = partialxxx______(
  makeDynamicLookupExpression,
  testStatic,
  makeDynamicTestExpression,
  makeDynamicDiscardExpression,
);

export const makeWriteEffect = partialxxx______(
  makeDynamicLookupEffect,
  testStatic,
  makeObservableDynamicTestExpression,
  makeDynamicWriteEffect,
);

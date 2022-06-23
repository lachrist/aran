import {
  assert,
  constant_,
  constant___,
  deadcode_____,
  partialxx______,
  hasOwnProperty,
  SyntaxAranError,
} from "../../../util/index.mjs";

import {
  NULL_DATA_DESCRIPTOR,
  conflictStaticInternal,
  makeStaticLookupNode,
  testStatic,
} from "./helper.mjs";

const {
  undefined,
  Reflect: {defineProperty},
} = globalThis;

export const KINDS = ["illegal"];

export const create = (_layer, _options) => ({static: {}});

export const conflict = conflictStaticInternal;

export const harvestHeader = constant_([]);

export const harvestPrelude = constant_([]);

export const declare = (
  _strict,
  {static: bindings},
  _kind,
  variable,
  {name},
) => {
  assert(!hasOwnProperty(bindings, variable), "duplicate variable");
  defineProperty(bindings, variable, {
    __proto__: NULL_DATA_DESCRIPTOR,
    value: name,
  });
};

export const makeInitializeStatements = deadcode_____(
  "initialization on illegal frame",
);

export const lookupAll = constant___(undefined);

const makeLookupNode = partialxx______(
  makeStaticLookupNode,
  testStatic,
  (_strict, _escaped, {static: bindings}, variable, _options) => {
    throw new SyntaxAranError(`Illegal ${bindings[variable]}`);
  },
);

export const makeReadExpression = makeLookupNode;

export const makeTypeofExpression = makeLookupNode;

export const makeDiscardExpression = makeLookupNode;

export const makeWriteEffect = makeLookupNode;

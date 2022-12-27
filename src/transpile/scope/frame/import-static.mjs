import {
  NULL_DATA_DESCRIPTOR,
  bind_____,
  constant___,
  constant_,
  assert,
  hasOwn,
  dropxxx_x,
  deadcode_____,
  partialxx______,
} from "../../../util/index.mjs";

import {
  makeExpressionEffect,
  makeImportExpression,
} from "../../../ast/index.mjs";

import { makeUnaryExpression } from "../../../intrinsic.mjs";

import {
  makeThrowConstantExpression,
  conflictStaticExternal,
  makeStaticLookupNode,
  testStatic,
  makeStaticDiscardExpression,
} from "./helper.mjs";

const {
  undefined,
  Reflect: { defineProperty },
} = globalThis;

export const KINDS = ["import"];

export const create = (_options) => ({ static: {} });

export const conflict = conflictStaticExternal;

export const harvestHeader = constant_([]);

export const harvestPrelude = constant_([]);

export const declare = (
  _strict,
  { static: bindings },
  _kind,
  variable,
  { source, specifier },
) => {
  assert(
    !hasOwn(bindings, variable),
    "duplicate variable should have been caught by conflict",
  );
  defineProperty(bindings, variable, {
    __proto__: NULL_DATA_DESCRIPTOR,
    value: { source, specifier },
  });
};

export const makeInitializeStatementArray = deadcode_____(
  "import variable should not be initialized",
);

export const lookupAll = constant___(undefined);

export const makeReadExpression = partialxx______(
  makeStaticLookupNode,
  testStatic,
  (_strict, _escaped, { static: bindings }, variable, _options) => {
    const { source, specifier } = bindings[variable];
    return makeImportExpression(source, specifier);
  },
);

export const makeTypeofExpression = partialxx______(
  makeStaticLookupNode,
  testStatic,
  (_strict, _escaped, { static: bindings }, variable, _options) => {
    const { source, specifier } = bindings[variable];
    return makeUnaryExpression(
      "typeof",
      makeImportExpression(source, specifier),
    );
  },
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

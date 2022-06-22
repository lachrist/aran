// This frame is useful to normalize for...in and for...of statements.
// for (let x = y + x of iterator) { ... }
// {
//   y + throwReferenceError("'x' is not initialized");
//   const iterator = iterator[Symbol.iterator]();
//   let step = iterator.next();
//   while (!step.done) {
//     let x;
//     x = step.value;
//     stop = iterator.next();
//     ...;
//   }
// }

import {
  hasOwnProperty,
  deadcode_____,
  bind_____,
  dropxxx_x,
  constant_,
  constant___,
  partialxx______,
  assert,
} from "../../../util/index.mjs";

import {makeExpressionEffect} from "../../../ast/index.mjs";

import {
  testStatic,
  conflictStatic,
  makeStaticDiscardExpression,
  makeStaticLookupNode,
  NULL_DATA_DESCRIPTOR,
  makeThrowDeadzoneExpression,
} from "./helper.mjs";

const {
  undefined,
  Reflect: {defineProperty},
} = globalThis;

export const KINDS = ["let", "const", "class"];

export const create = (_layer, _options) => ({
  static: {},
});

export const conflict = conflictStatic;

export const harvestHeader = constant_([]);

export const harvestPrelude = constant_([]);

export const declare = (
  _strict,
  {static: bindings},
  _kind,
  variable,
  {exports: specifiers},
) => {
  assert(specifiers.length === 0, "unexpected exported variable");
  assert(
    !hasOwnProperty(bindings, variable),
    "duplicate variable should have been caught by conflict",
  );
  defineProperty(bindings, variable, NULL_DATA_DESCRIPTOR);
};

export const makeInitializeStatementArray = deadcode_____(
  "initialization is forbidden in dead frames",
);

const makeThrowDeadzoneExpressionDropped = dropxxx_x(
  makeThrowDeadzoneExpression,
);

export const lookupAll = constant___(undefined);

export const makeReadExpression = partialxx______(
  makeStaticLookupNode,
  testStatic,
  makeThrowDeadzoneExpressionDropped,
);

export const makeTypeofExpression = partialxx______(
  makeStaticLookupNode,
  testStatic,
  makeThrowDeadzoneExpressionDropped,
);

export const makeDiscardExpression = partialxx______(
  makeStaticLookupNode,
  testStatic,
  makeStaticDiscardExpression,
);

export const makeWriteEffect = partialxx______(
  makeStaticLookupNode,
  testStatic,
  bind_____(makeExpressionEffect, makeThrowDeadzoneExpressionDropped),
);

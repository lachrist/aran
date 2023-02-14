// This frame is useful to normalize for...in and for...of statements.
// for (let x = y + x of iterator) { ... }
// {
//   y + throwReferenceError("'x' is not initialized");
//   const iterator = iterator[Symbol.iterator]();
//   let step = iterator.next(strict, scope, escaped, variable, options);
//   while (!step.done) {
//     let x;
//     x = step.value;
//     stop = iterator.next(strict, scope, escaped, variable, options);
//     ...;
//   }
// }

import {
  NULL_DATA_DESCRIPTOR,
  hasOwn,
  deadcode_____,
  constant_,
  constant___,
  assert,
  expect1,
} from "../../../util/index.mjs";

import { makeLiteralExpression } from "../../../ast/index.mjs";

import {
  DuplicateError,
  DUPLICATE_TEMPLATE,
  makeThrowDeadzoneExpression,
  makeThrowDeadzoneEffect,
} from "./helper.mjs";

const {
  undefined,
  Reflect: { defineProperty },
} = globalThis;

export const KINDS = ["let", "const", "class"];

export const createFrame = (_options) => ({
  bindings: {},
});

export const conflictFrame = (_strict, { bindings }, _kind, variable) => {
  expect1(
    !hasOwn(bindings, variable),
    DuplicateError,
    DUPLICATE_TEMPLATE,
    variable,
  );
};

export const harvestFrameHeader = constant_([]);

export const harvestFramePrelude = constant_([]);

export const declareFrame = (
  _strict,
  { bindings },
  _kind,
  variable,
  { exports: specifiers },
) => {
  assert(specifiers.length === 0, "unexpected exported variable");
  expect1(
    !hasOwn(bindings, variable),
    DuplicateError,
    DUPLICATE_TEMPLATE,
    variable,
  );
  defineProperty(bindings, variable, NULL_DATA_DESCRIPTOR);
};

export const makeFrameInitializeStatementArray = deadcode_____(
  "initialization is forbidden in dead frames",
);

export const lookupFrameAll = constant___(undefined);

const compileMakeLookupNode =
  (makeNode) =>
  (next, strict, { bindings }, scope, escaped, variable, options) =>
    hasOwn(bindings, variable)
      ? makeNode(variable)
      : next(strict, scope, escaped, variable, options);

export const makeFrameReadExpression = compileMakeLookupNode(
  makeThrowDeadzoneExpression,
);

export const makeFrameTypeofExpression = compileMakeLookupNode(
  makeThrowDeadzoneExpression,
);

export const makeFrameDiscardExpression = compileMakeLookupNode(
  constant_(makeLiteralExpression(false)),
);

export const makeFrameWriteEffect = compileMakeLookupNode(
  makeThrowDeadzoneEffect,
);

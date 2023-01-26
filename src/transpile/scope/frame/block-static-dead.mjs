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

export const create = (_options) => ({
  bindings: {},
});

export const conflict = (_strict, { bindings }, _kind, variable) => {
  expect1(
    !hasOwn(bindings, variable),
    DuplicateError,
    DUPLICATE_TEMPLATE,
    variable,
  );
};

export const harvestHeader = constant_([]);

export const harvestPrelude = constant_([]);

export const declare = (
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

export const makeInitializeStatementArray = deadcode_____(
  "initialization is forbidden in dead frames",
);

export const lookupAll = constant___(undefined);

const compileMakeLookupNode =
  (makeNode) =>
  (next, _strict, _escaped, { bindings }, variable, _options) =>
    hasOwn(bindings, variable) ? makeNode(variable) : next();

export const makeReadExpression = compileMakeLookupNode(
  makeThrowDeadzoneExpression,
);

export const makeTypeofExpression = compileMakeLookupNode(
  makeThrowDeadzoneExpression,
);

export const makeDiscardExpression = compileMakeLookupNode(
  constant_(makeLiteralExpression(false)),
);

export const makeWriteEffect = compileMakeLookupNode(makeThrowDeadzoneEffect);

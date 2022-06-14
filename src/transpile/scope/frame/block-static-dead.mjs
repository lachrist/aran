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

import {includes} from "array-lite";

import {
  expect,
  SyntaxAranError,
  deadcode_____,
  bind____,
  dropxxx_,
  push,
  constant_,
  partialxx_____,
  drop_____xx,
  assert,
} from "../../../util/index.mjs";

import {
  makeExpressionEffect,
  makeLiteralExpression,
} from "../../../ast/index.mjs";

import {
  makeStaticLookupNode,
  DUPLICATE_TEMPLATE,
  makeThrowDiscardExpression,
  makeThrowDeadzoneExpression,
} from "./helper.mjs";

export const KINDS = ["let", "const", "class"];

export const create = (_layer, _options) => ({
  bindings: [],
});

export const conflict = (_strict, {bindings}, _kind, variable) => {
  expect(!includes(bindings, variable), SyntaxAranError, DUPLICATE_TEMPLATE, [
    variable,
  ]);
};

export const harvest = constant_({
  header: [],
  prelude: [],
});

export const declare = (
  _strict,
  {bindings},
  _kind,
  variable,
  {exports: eexports},
) => {
  assert(eexports.length === 0, "unexpected exported variable");
  assert(
    !includes(bindings, variable),
    "duplicate variable should have been caught by conflict",
  );
  push(bindings, variable);
};

export const makeInitializeStatements = deadcode_____(
  "initialization is forbidden in dead frames",
);

const test = ({bindings}, variable) => includes(bindings, variable);

export const makeReadExpression = partialxx_____(
  makeStaticLookupNode,
  test,
  dropxxx_(makeThrowDeadzoneExpression),
);

export const makeTypeofExpression = partialxx_____(
  makeStaticLookupNode,
  test,
  dropxxx_(makeThrowDeadzoneExpression),
);

export const makeDiscardExpression = partialxx_____(
  makeStaticLookupNode,
  test,
  (strict, _escaped, _frame, variable) =>
    strict
      ? makeThrowDiscardExpression(variable)
      : makeLiteralExpression(false),
);

export const makeWriteEffect = drop_____xx(
  partialxx_____(
    makeStaticLookupNode,
    test,
    bind____(makeExpressionEffect, dropxxx_(makeThrowDeadzoneExpression)),
  ),
);

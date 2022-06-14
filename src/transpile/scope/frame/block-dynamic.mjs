import {concat, includes, map} from "array-lite";

import {
  expect,
  push,
  assert,
  partialx_,
  SyntaxAranError,
  incrementCounter,
  partial____xx,
  partialxxx_____,
} from "../../../util/index.mjs";

import {
  makeEffectStatement,
  makeExpressionEffect,
  makeConditionalExpression,
  makeLiteralExpression,
} from "../../../ast/index.mjs";

import {
  makeUnaryExpression,
  makeDeleteExpression,
  makeSetExpression,
  makeDefineExpression,
  makeBinaryExpression,
  makeGetExpression,
  makeDataDescriptorExpression,
  makeDeadzoneExpression,
} from "../../../intrinsic.mjs";

import {
  makeDynamicLookupEffect,
  makeDynamicLookupExpression,
  DUPLICATE_TEMPLATE,
  makeThrowDeadzoneExpression,
  makeThrowDuplicateExpression,
} from "./helper.mjs";

const makeConflictStatement = (dynamic, variable) =>
  makeEffectStatement(
    makeExpressionEffect(
      makeConditionalExpression(
        makeBinaryExpression("in", makeLiteralExpression(variable), dynamic),
        makeThrowDuplicateExpression(variable),
        makeLiteralExpression({undefined: null}),
      ),
    ),
  );

const makeDeclareStatement = (dynamic, variable) =>
  makeEffectStatement(
    makeExpressionEffect(
      makeDefineExpression(
        dynamic,
        makeLiteralExpression(variable),
        makeDataDescriptorExpression(
          makeDeadzoneExpression(),
          makeLiteralExpression(true),
          makeLiteralExpression(true),
          makeLiteralExpression(false),
        ),
      ),
    ),
  );

export const KINDS = ["let", "const", "class"];

export const create = (_layer, {dynamic, observable}) => ({
  dynamic,
  observable,
  conflicts: [],
  bindings: [],
});

export const conflict = (_strict, {conflicts, bindings}, _kind, variable) => {
  expect(
    !includes(bindings, variable),
    SyntaxAranError,
    DUPLICATE_TEMPLATE,
    variable,
  );
  if (!includes(conflicts, variable)) {
    push(conflicts, variable);
  }
};

export const harvest = ({dynamic, conflicts, bindings}) => ({
  header: [],
  prelude: concat(
    map(conflicts, partialx_(makeConflictStatement, dynamic)),
    map(bindings, partialx_(makeDeclareStatement, dynamic)),
  ),
});

export const declare = (
  _strict,
  {bindings},
  _kind,
  variable,
  {exports: eexports},
) => {
  assert(eexports.length === 0, "unexpected global exported variable");
  assert(
    !includes(bindings, variable),
    "duplicate variable should have been caught by conflict",
  );
  push(bindings, variable);
};

export const makeInitializeStatementArray = (
  _strict,
  {dynamic},
  kind,
  variable,
  expression,
) => [
  makeEffectStatement(
    makeExpressionEffect(
      makeDefineExpression(
        dynamic,
        makeLiteralExpression(variable),
        makeDataDescriptorExpression(
          expression,
          makeLiteralExpression(kind !== "const"),
          makeLiteralExpression(true),
          makeLiteralExpression(false),
        ),
      ),
    ),
  ),
];

const makeDeadzoneConditionalExpression = (dynamic, variable, expression) =>
  makeConditionalExpression(
    makeBinaryExpression(
      "===",
      makeGetExpression(dynamic, makeLiteralExpression(variable)),
      makeDeadzoneExpression(),
    ),
    makeThrowDeadzoneExpression(variable),
    expression,
  );

const test = ({bindings}, variable) => includes(bindings, variable);

const makeTestExpression = ({dynamic}, variable) =>
  makeBinaryExpression("in", makeLiteralExpression(variable), dynamic);

export const makeReadExpression = partialxxx_____(
  makeDynamicLookupExpression,
  test,
  makeTestExpression,
  (_strict, _escaped, {dynamic}, variable) =>
    makeDeadzoneConditionalExpression(
      dynamic,
      variable,
      makeGetExpression(dynamic, makeLiteralExpression(variable)),
    ),
);

export const makeTypeofExpression = partialxxx_____(
  makeDynamicLookupExpression,
  test,
  makeTestExpression,
  (_strict, _escaped, {dynamic}, variable) =>
    makeDeadzoneConditionalExpression(
      dynamic,
      variable,
      makeUnaryExpression(
        "typeof",
        makeGetExpression(dynamic, makeLiteralExpression(variable)),
      ),
    ),
);

export const makeDiscardExpression = partialxxx_____(
  makeDynamicLookupExpression,
  test,
  makeTestExpression,
  (strict, _escaped, {dynamic}, variable) =>
    makeDeleteExpression(strict, dynamic, makeLiteralExpression(variable)),
);

const makeHitWriteEffect = (
  strict,
  _escaped,
  {dynamic, observable},
  variable,
  expression,
  counter,
) => {
  if (observable) {
    incrementCounter(counter);
  }
  incrementCounter(counter);
  return makeExpressionEffect(
    makeDeadzoneConditionalExpression(
      dynamic,
      variable,
      makeSetExpression(
        strict,
        dynamic,
        makeLiteralExpression(variable),
        expression,
      ),
    ),
  );
};

export const makeWriteEffect = (
  miss,
  strict,
  escaped,
  frame,
  variable,
  expression,
  counter,
) =>
  makeDynamicLookupEffect(
    test,
    makeTestExpression,
    partial____xx(makeHitWriteEffect, expression, counter),
    miss,
    strict,
    escaped,
    frame,
    variable,
  );

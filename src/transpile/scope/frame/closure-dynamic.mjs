import {map, includes} from "array-lite";

import {
  push,
  assert,
  incrementCounter,
  constant_,
  partialx_,
  partialxxx_____,
  partial____xx,
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
  makeGetExpression,
  makeSetExpression,
  makeDefineExpression,
  makeBinaryExpression,
  makeDataDescriptorExpression,
} from "../../../intrinsic.mjs";

import {
  makeDynamicLookupExpression,
  makeDynamicLookupEffect,
} from "./helper.mjs";

const {undefined} = globalThis;

export const KINDS = ["var", "function"];

export const create = (_layer, {dynamic, observable}) => ({
  dynamic,
  bindings: [],
  observable,
});

export const conflict = constant_(undefined);

const makeDeclareStatement = (dynamic, variable) =>
  makeEffectStatement(
    makeExpressionEffect(
      makeConditionalExpression(
        makeBinaryExpression("in", makeLiteralExpression(variable), dynamic),
        makeLiteralExpression({undefined: null}),
        makeDefineExpression(
          dynamic,
          makeLiteralExpression(variable),
          makeDataDescriptorExpression(
            makeLiteralExpression({undefined: null}),
            makeLiteralExpression(true),
            makeLiteralExpression(true),
            makeLiteralExpression(false),
          ),
        ),
      ),
    ),
  );

export const harvest = ({dynamic, bindings}) => ({
  header: [],
  prelude: map(bindings, partialx_(makeDeclareStatement, dynamic)),
});

export const declare = (
  _strict,
  {bindings},
  _kind,
  variable,
  {exports: eexports},
) => {
  assert(eexports.length === 0, "unexpected global exported variable");
  if (!includes(bindings, variable)) {
    push(bindings, variable);
  }
};

export const makeInitializeStatementArray = (
  strict,
  {dynamic, bindings},
  _kind,
  variable,
  expression,
) => {
  assert(includes(bindings, variable), "missing binding for variable");
  return [
    makeEffectStatement(
      makeExpressionEffect(
        makeSetExpression(
          strict,
          dynamic,
          makeLiteralExpression(variable),
          expression,
        ),
      ),
    ),
  ];
};

const test = ({bindings}, variable) => includes(bindings, variable);

const makeTestExpression = ({dynamic}, variable) =>
  makeBinaryExpression("in", makeLiteralExpression(variable), dynamic);

export const makeReadExpression = partialxxx_____(
  makeDynamicLookupExpression,
  test,
  makeTestExpression,
  (_strict, _escaped, {dynamic}, variable) =>
    makeGetExpression(dynamic, makeLiteralExpression(variable)),
);

export const makeTypeofExpression = partialxxx_____(
  makeDynamicLookupExpression,
  test,
  makeTestExpression,
  (_strict, _escaped, {dynamic}, variable) =>
    makeUnaryExpression(
      "typeof",
      makeGetExpression(dynamic, makeLiteralExpression(variable)),
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
  {observable, dynamic},
  variable,
  expression,
  counter,
) => {
  if (observable) {
    incrementCounter(counter);
  }
  incrementCounter(counter);
  return makeExpressionEffect(
    makeSetExpression(
      strict,
      dynamic,
      makeLiteralExpression(variable),
      expression,
    ),
  );
};

export const makeWriteEffect = (
  next,
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
    next,
    strict,
    escaped,
    frame,
    variable,
  );

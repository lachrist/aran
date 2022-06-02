import {map, includes} from "array-lite";

import {push, assert, partialx_} from "../../../util/index.mjs";

import {
  makeEffectStatement,
  makeExpressionEffect,
  makeConditionalExpression,
  makeLiteralExpression,
  makeConditionalEffect,
} from "../../../ast/index.mjs";

import {
  makeDefineExpression,
  makeBinaryExpression,
  makeGetExpression,
  makeDataDescriptorExpression,
  makeDeadzoneExpression,
} from "../../../intrinsic.mjs";

import {isDiscard} from "../right.mjs";

import {
  makeDynamicLookupExpression,
  makeDynamicLookupEffect,
  makeThrowDeadzoneExpression,
  makeThrowDuplicateExpression,
} from "./helper.mjs";

export const kinds = ["let", "const", "class"];

export const makeDuplicateStatement = (expression, variable) =>
  makeEffectStatement(
    makeExpressionEffect(
      makeConditionalExpression(
        makeBinaryExpression("in", makeLiteralExpression(variable), expression),
        makeThrowDuplicateExpression(variable),
        makeLiteralExpression({undefined: null}),
      ),
    ),
  );

export const create = (_layer, {dynamic}) => ({
  dynamic,
  variables: [],
});

export const harvest = ({dynamic, variables}) => ({
  header: [],
  prelude: map(variables, partialx_(makeDuplicateStatement, dynamic)),
});

export const makeDeclareStatements = (
  _strict,
  {variables, dynamic},
  kind,
  variable,
  iimport,
  eexports,
) => {
  push(variables, variable);
  if (includes(kinds, kind)) {
    assert(iimport === null, "unexpected global imported variable");
    assert(eexports.length === 0, "unexpected global exported variable");
    return [
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
      ),
    ];
  } else {
    return null;
  }
};

export const makeInitializeStatements = (
  _strict,
  {dynamic},
  kind,
  variable,
  expression,
) => {
  if (includes(kinds, kind)) {
    return [
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
  } else {
    return null;
  }
};

export const makeLookupExpression = (
  next,
  strict,
  _escaped,
  {dynamic},
  variable,
  right,
) =>
  makeConditionalExpression(
    makeBinaryExpression("in", makeLiteralExpression(variable), dynamic),
    isDiscard(right)
      ? makeDynamicLookupExpression(strict, dynamic, variable, right)
      : makeConditionalExpression(
          makeBinaryExpression(
            "===",
            makeGetExpression(dynamic, makeLiteralExpression(variable)),
            makeDeadzoneExpression(),
          ),
          makeThrowDeadzoneExpression(variable),
          makeDynamicLookupExpression(strict, dynamic, variable, right),
        ),
    next(),
  );

export const makeLookupEffect = (
  next,
  strict,
  _escaped,
  {dynamic},
  variable,
  right,
) =>
  makeConditionalEffect(
    makeBinaryExpression("in", makeLiteralExpression(variable), dynamic),
    makeConditionalEffect(
      makeBinaryExpression(
        "===",
        makeGetExpression(dynamic, makeLiteralExpression(variable)),
        makeDeadzoneExpression(),
      ),
      makeExpressionEffect(makeThrowDeadzoneExpression(variable)),
      makeDynamicLookupEffect(strict, dynamic, variable, right),
    ),
    next(),
  );

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
  makeThrowSyntaxErrorExpression,
  makeThrowReferenceErrorExpression,
  makeDefineExpression,
  makeBinaryExpression,
  makeGetExpression,
  makeDataDescriptorExpression,
  makeDeadzoneExpression,
} from "../../../intrinsic.mjs";

import {isDiscard, isWrite} from "../right.mjs";

import {makeDynamicLookupExpression} from "./helper.mjs";

export const kinds = ["let", "const", "class"];

export const create = (_layer, {dynamic}) => ({
  dynamic,
  variables: [],
});

export const makeDuplicateStatement = (expression, variable) =>
  makeEffectStatement(
    makeExpressionEffect(
      makeConditionalExpression(
        makeBinaryExpression("in", makeLiteralExpression(variable), expression),
        makeThrowSyntaxErrorExpression(
          `Identifier '${variable}' has already been declared`,
        ),
        makeLiteralExpression({undefined: null}),
      ),
    ),
  );

export const harvest = ({dynamic, variables}) => ({
  header: [],
  prelude: map(variables, partialx_(makeDuplicateStatement, dynamic)),
});

export const declare = (
  {variables, dynamic},
  _strict,
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

export const initialize = ({dynamic}, _strict, kind, variable, expression) => {
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

const makeDeadzoneConditionalExpression = (variable, dynamic, alive) =>
  makeConditionalExpression(
    makeBinaryExpression(
      "===",
      makeGetExpression(dynamic, makeLiteralExpression(variable)),
      makeDeadzoneExpression(),
    ),
    makeThrowReferenceErrorExpression(
      `Cannot access '${variable}' before initialization`,
    ),
    alive,
  );

export const lookup = (next, {dynamic}, strict, _escaped, variable, right) => {
  const key = makeLiteralExpression(variable);
  if (isWrite(right)) {
    return makeConditionalEffect(
      makeBinaryExpression("in", key, dynamic),
      makeExpressionEffect(
        makeDeadzoneConditionalExpression(
          variable,
          dynamic,
          makeDynamicLookupExpression(strict, dynamic, key, right),
        ),
      ),
      next(),
    );
  } else {
    return makeConditionalExpression(
      makeBinaryExpression("in", key, dynamic),
      isDiscard(right)
        ? makeDynamicLookupExpression(strict, dynamic, key, right)
        : makeDeadzoneConditionalExpression(
            variable,
            dynamic,
            makeDynamicLookupExpression(strict, dynamic, key, right),
          ),
      next(),
    );
  }
};

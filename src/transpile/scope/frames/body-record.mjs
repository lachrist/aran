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
  makeUnaryExpression,
  makeBinaryExpression,
  makeGetExpression,
  makeDeleteExpression,
  makeSetExpression,
  makeDataDescriptorExpression,
  makeDeadzoneExpression,
} from "../../../intrinsic.mjs";

import {isRead, isTypeof, isDiscard, isWrite, accessWrite} from "../right.mjs";

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

export const initialize = ({dynamic}, kind, variable, expression) => {
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

const makeLookupExpression = (strict, object, key, right) => {
  if (isRead(right)) {
    return makeGetExpression(object, key);
  } else if (isTypeof(right)) {
    return makeUnaryExpression("typeof", makeGetExpression(object, key));
  } else if (isDiscard(right)) {
    return makeDeleteExpression(strict, object, key);
  } else {
    return makeSetExpression(strict, object, key, accessWrite(right));
  }
};

export const lookup = (next, {dynamic}, strict, _escaped, variable, right) => {
  const key = makeLiteralExpression(variable);
  if (isWrite(right)) {
    return makeConditionalEffect(
      makeBinaryExpression("in", key, dynamic),
      makeExpressionEffect(
        makeDeadzoneConditionalExpression(
          variable,
          dynamic,
          makeLookupExpression(strict, dynamic, key, right),
        ),
      ),
      next(),
    );
  } else {
    return makeConditionalExpression(
      makeBinaryExpression("in", key, dynamic),
      isDiscard(right)
        ? makeLookupExpression(strict, dynamic, key, right)
        : makeDeadzoneConditionalExpression(
            variable,
            dynamic,
            makeLookupExpression(strict, dynamic, key, right),
          ),
      next(),
    );
  }
};

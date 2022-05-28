import {includes} from "array-lite";

import {constant_, assert} from "../../../util/index.mjs";

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
  makeSetExpression,
  makeDataDescriptorExpression,
  makeDeadzoneExpression,
} from "../../../intrinsic.mjs";

import {isWrite} from "../right.mjs";

import {makeDynamicLookupExpression} from "./helper.mjs";

const kinds = ["var", "function"];

export const create = (object) => ({
  object,
  variables: [],
});

export const harvest = constant_({prelude: [], header: []});

export const declare = (
  {object},
  _strict,
  kind,
  variable,
  iimport,
  eexports,
) => {
  assert(includes(kinds, kind), "unexpected kind");
  assert(iimport === null, "unexpected global imported variable");
  assert(eexports.length === 0, "unexpected global exported variable");
  return [
    makeEffectStatement(
      makeExpressionEffect(
        makeConditionalExpression(
          makeBinaryExpression("in", makeLiteralExpression(variable), object),
          makeLiteralExpression({undefined: null}),
          makeDefineExpression(
            object,
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
    ),
  ];
};

export const initialize = ({object}, strict, kind, variable, expression) => {
  assert(includes(kinds, kind), "unexpected kind");
  return [
    makeEffectStatement(
      makeExpressionEffect(
        makeSetExpression(
          strict,
          object,
          makeLiteralExpression(variable),
          expression,
        ),
      ),
    ),
  ];
};

export const lookup = (next, {object}, _escaped, strict, variable, right) => {
  const key = makeLiteralExpression(variable);
  if (isWrite(right)) {
    return makeConditionalEffect(
      makeBinaryExpression("in", key, object),
      makeExpressionEffect(
        makeDeadzoneExpression(
          variable,
          object,
          makeDynamicLookupExpression(strict, object, key, right),
        ),
      ),
      next(),
    );
  } else {
    return makeConditionalExpression(
      makeBinaryExpression("in", key, object),
      makeDynamicLookupExpression(object, key, right),
      next(),
    );
  }
};

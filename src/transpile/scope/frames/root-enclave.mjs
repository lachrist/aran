import {includes} from "array-lite";

import {bind______, constant_, assert} from "../../../util/index.mjs";

import {
  makeApplyExpression,
  makeLiteralExpression,
  makeExpressionEffect,
  makeDeclareStatement,
} from "../../../ast/index.mjs";

import {isWrite, isRead, isTypeof, isDiscard, accessWrite} from "../right.mjs";

const kinds = ["var", "function"];

export const create = (_layer, options) => ({
  ...options,
});

export const harvest = constant_({header: [], prelude: []});

export const makeDeclareStatements = (
  _strict,
  _frame,
  kind,
  _variable,
  iimport,
  eexports,
) => {
  assert(includes(kinds, kind), "unexpected kind");
  assert(iimport === null, "unexpected imported variable");
  assert(eexports.length === 0, "unexpected exported variable");
  return [];
};

export const makeInitializeStatements = (
  _strict,
  _frame,
  kind,
  variable,
  expression,
) => {
  assert(includes(kinds, kind), "unexpected kind");
  return [makeDeclareStatement("var", variable, expression)];
};

const pick = (frame, right, strict) => {
  if (isRead(right)) {
    return frame.read[strict ? "strict" : "sloppy"];
  } else if (isTypeof(right)) {
    return frame.typeof[strict ? "strict" : "sloppy"];
  } else if (isDiscard(right)) {
    return frame.discard[strict ? "strict" : "sloppy"];
  } else {
    return frame.write[strict ? "strict" : "sloppy"];
  }
};

export const makeLookupExpression = (
  _next,
  strict,
  _escaped,
  frame,
  variable,
  right,
) => {
  const expression = pick(frame, right, strict);
  if (isWrite(right)) {
    return makeApplyExpression(
      expression,
      makeLiteralExpression({undefined: null}),
      [makeLiteralExpression(variable), accessWrite(right)],
    );
  } else {
    return makeApplyExpression(
      expression,
      makeLiteralExpression({undefined: null}),
      [makeLiteralExpression(variable)],
    );
  }
};

export const makeLookupEffect = bind______(
  makeExpressionEffect,
  makeLookupExpression,
);

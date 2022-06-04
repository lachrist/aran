import {assert, constant_, bind______} from "../../../util/index.mjs";

import {
  makeExpressionEffect,
  makeDeclareStatement,
} from "../../../ast/index.mjs";

import {
  makeSetGlobalExpression,
  makeTypeofGlobalExpression,
  makeGetGlobalExpression,
  makeDeleteGlobalExpression,
} from "../../../intrinsic.mjs";

import {isRead, isTypeof, isDiscard, accessWrite} from "../right.mjs";

export const KINDS = ["var", "function", "let", "const", "class"];

const mapping = {
  var: "var",
  function: "var",
  let: "let",
  const: "const",
  class: "let",
};

export const create = (_layer, _options) => ({});

export const harvest = constant_({header: [], prelude: []});

export const makeDeclareStatements = (
  _strict,
  _frame,
  _kind,
  _variable,
  iimport,
  eexports,
) => {
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
) => [makeDeclareStatement(mapping[kind], variable, expression)];

export const makeLookupExpression = (
  _next,
  strict,
  _escaped,
  _frame,
  variable,
  right,
) => {
  if (isRead(right)) {
    return makeGetGlobalExpression(variable);
  } else if (isTypeof(right)) {
    return makeTypeofGlobalExpression(variable);
  } else if (isDiscard(right)) {
    return makeDeleteGlobalExpression(strict, variable);
  } else {
    return makeSetGlobalExpression(strict, variable, accessWrite(right));
  }
};

export const makeLookupEffect = bind______(
  makeExpressionEffect,
  makeLookupExpression,
);

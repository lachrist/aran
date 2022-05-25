import {hasOwnProperty, assert, constant__} from "../../../util/index.mjs";

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

const kinds = {
  let: "let",
  class: "let",
  const: "const",
  var: "var",
  function: "var",
};

export const create = constant__(null);

export const declare = (_frame, kind, _variable, iimport, eexports) => {
  assert(hasOwnProperty(kinds, kind), "unexpected kind");
  assert(iimport === null, "unexpected imported variable");
  assert(eexports.length === 0, "unexpected exported variable");
  return [];
};

export const initialize = (_frame, kind, variable, expression) => {
  assert(hasOwnProperty(kinds, kind), "unexpected kind");
  return [makeDeclareStatement(kinds[kind], variable, expression)];
};

export const lookup = (_next, _frame, strict, _escaped, variable, right) => {
  if (isRead(right)) {
    return makeGetGlobalExpression(variable);
  } else if (isTypeof(right)) {
    return makeTypeofGlobalExpression(variable);
  } else if (isDiscard(right)) {
    return makeDeleteGlobalExpression(strict, variable);
  } else {
    return makeExpressionEffect(
      makeSetGlobalExpression(strict, variable, accessWrite(right)),
    );
  }
};

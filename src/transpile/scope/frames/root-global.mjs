import {assert, constant} from "../../../util/index.mjs";

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

import {isRead, isTypeof, isDelete, accessWrite} from "../right.mjs";

const kinds = {
  __proto__: null,
  let: "let",
  class: "let",
  const: "const",
  var: "var",
  function: "var",
};

export const create = constant(null);

export const declare = (_frame, kind, _variable, import_, exports_) => {
  assert(kind in kinds, "unexpected kind");
  assert(import_ === null, "unexpected imported variable");
  assert(exports_.length === 0, "unexpected exported variable");
  return [];
};

export const initialize = (_frame, kind, variable, expression) => {
  assert(kind in kinds, "unexpected kind");
  return [makeDeclareStatement(kinds[kind], variable, expression)];
};

export const lookup = (_next, _frame, strict, _escaped, variable, right) => {
  if (isRead(right)) {
    return makeGetGlobalExpression(variable);
  } else if (isTypeof(right)) {
    return makeTypeofGlobalExpression(variable);
  } else if (isDelete(right)) {
    return makeDeleteGlobalExpression(strict, variable);
  } else {
    return makeExpressionEffect(
      makeSetGlobalExpression(strict, variable, accessWrite(right)),
    );
  }
};

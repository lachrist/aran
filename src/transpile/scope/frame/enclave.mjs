import {constant_, bind______, assert} from "../../../util/index.mjs";

import {
  makeApplyExpression,
  makeLiteralExpression,
  makeExpressionEffect,
  makeDeclareStatement,
} from "../../../ast/index.mjs";

import {isWrite, isRead, isTypeof, isDiscard, accessWrite} from "../right.mjs";

const {undefined} = globalThis;

export const KINDS = ["var", "function", "let", "const", "class"];

const mapping = {
  var: "var",
  function: "var",
  let: "let",
  const: "const",
  class: "let",
};

export const create = (_layer, {enclaves}) => ({
  enclaves,
});

export const conflict = constant_(undefined);

export const harvest = constant_({header: [], prelude: []});

export const makeDeclareStatements = (
  _strict,
  _frame,
  _kind,
  _variable,
  {exports: eexports},
) => {
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

const pick = (enclaves, right, strict) => {
  if (isRead(right)) {
    return enclaves.read;
  } else if (isTypeof(right)) {
    return enclaves.typeof;
  } else if (isDiscard(right)) {
    return enclaves[strict ? "discardStrict" : "discardSloppy"];
  } else {
    return enclaves[strict ? "writeStrict" : "writeSloppy"];
  }
};

export const makeLookupExpression = (
  _next,
  strict,
  _escaped,
  {enclaves},
  variable,
  right,
) => {
  const expression = pick(enclaves, right, strict);
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

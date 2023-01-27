import {
  constant_,
  constant___,
  constant____,
  assert,
  expect1,
  dropxxxx_x,
  incrementCounter,
  EnclaveLimitationAranError,
} from "../../../util/index.mjs";

import {
  makeDeclareExternalStatement,
  makeReadExternalExpression,
  makeTypeofExternalExpression,
  makeWriteExternalEffect,
} from "../../../ast/index.mjs";

const {
  undefined,
  Reflect: { ownKeys },
} = globalThis;

const mapping = {
  var: "var",
  function: "var",
  let: "let",
  const: "const",
  class: "let",
};

export const KINDS = ownKeys(mapping);

export const create = ({ program }) => ({ program });

export const conflict = constant____(undefined);

export const harvestHeader = constant_([]);

export const harvestPrelude = constant_([]);

const checkProgram = ({ program }, variable) => {
  expect1(
    program === "script",
    EnclaveLimitationAranError,
    "Aran only support declaring external variables in script programs, got: %s",
    variable,
  );
};

// TODO
// Detect when declare external global variable
// is made from a local eval program.
// It should throw an EnclaveLimitationAranError

export const declare = (
  _strict,
  frame,
  _kind,
  variable,
  { exports: specifiers },
) => {
  checkProgram(frame, variable);
  assert(specifiers.length === 0, "declare exported variable on enclave frame");
};

export const makeInitializeStatementArray = (
  _strict,
  frame,
  kind,
  variable,
  expression,
) => {
  checkProgram(frame, variable);
  return [makeDeclareExternalStatement(mapping[kind], variable, expression)];
};

export const lookupAll = constant___(undefined);

export const makeReadExpression = dropxxxx_x(makeReadExternalExpression);

export const makeTypeofExpression = dropxxxx_x(makeTypeofExternalExpression);

export const makeDiscardExpression = (
  _next,
  _strict,
  _escaped,
  _frame,
  variable,
  _options,
) => {
  throw new EnclaveLimitationAranError(
    `Aran does not support deleting external variables, got: ${variable}`,
  );
};

export const makeWriteEffect = (
  _next,
  strict,
  _escaped,
  _frame,
  variable,
  { counter, expression },
) => {
  expect1(
    strict,
    EnclaveLimitationAranError,
    "Aran does not support assigning to external variables in non-strict mode, got: %s",
    variable,
  );
  incrementCounter(counter);
  incrementCounter(counter);
  return makeWriteExternalEffect(variable, expression);
};

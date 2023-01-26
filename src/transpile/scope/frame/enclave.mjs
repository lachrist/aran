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

export const create = ({}) => ({});

export const conflict = constant____(undefined);

export const harvestHeader = constant_([]);

export const harvestPrelude = constant_([]);

export const declare = (
  _strict,
  _frame,
  _kind,
  _variable,
  { exports: specifiers },
) => {
  assert(specifiers.length === 0, "declare exported variable on enclave frame");
};

export const makeInitializeStatementArray = (
  _strict,
  _frame,
  kind,
  variable,
  expression,
) => [makeDeclareExternalStatement(mapping[kind], variable, expression)];

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
    `Aran does not support deleting external variable, got: ${variable}`,
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
    "Aran does not support assigning to external variable in non-strict mode, got: %s",
    variable,
  );
  incrementCounter(counter);
  incrementCounter(counter);
  return makeWriteExternalEffect(variable, expression);
};

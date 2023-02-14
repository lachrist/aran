import { includes } from "array-lite";

import {
  constant_,
  constant___,
  assert,
  expect1,
  dropxxxxx_x,
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

const KINDS = ownKeys(mapping);

export const createFrame = ({ program }) => ({ program });

export const harvestFrameHeader = constant_([]);

export const harvestFramePrelude = constant_([]);

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

export const declareFrame = (_strict, frame, kind, variable, options) => {
  if (includes(KINDS, kind)) {
    const { exports: specifiers } = options;
    checkProgram(frame, variable);
    assert(
      specifiers.length === 0,
      "declare exported variable on enclave frame",
    );
    return true;
  } else {
    return false;
  }
};

export const makeFrameInitializeStatementArray = (
  _strict,
  frame,
  kind,
  variable,
  expression,
) => {
  if (includes(KINDS, kind)) {
    checkProgram(frame, variable);
    return [makeDeclareExternalStatement(mapping[kind], variable, expression)];
  } else {
    return null;
  }
};

export const lookupFrameAll = constant___(undefined);

export const makeFrameReadExpression = dropxxxxx_x(makeReadExternalExpression);

export const makeFrameTypeofExpression = dropxxxxx_x(
  makeTypeofExternalExpression,
);

export const makeFrameDiscardExpression = (
  _next,
  _strict,
  _frame,
  _scope,
  _escaped,
  variable,
  _options,
) => {
  throw new EnclaveLimitationAranError(
    `Aran does not support deleting external variables, got: ${variable}`,
  );
};

export const makeFrameWriteEffect = (
  _next,
  strict,
  _frame,
  _scope,
  _escaped,
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

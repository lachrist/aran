import { includes } from "array-lite";

import {
  hasOwn,
  assert,
  expect1,
  dropxxxxx_x,
  incrementCounter,
  EnclaveLimitationAranError,
} from "../../util/index.mjs";

import {
  makeDeclareExternalStatement,
  makeReadExternalExpression,
  makeTypeofExternalExpression,
  makeWriteExternalEffect,
} from "../../ast/index.mjs";

import {
  createEmptyFrame,
  harvestEmptyFrameHeader,
  harvestEmptyFramePrelude,
  lookupEmptyFrameAll,
} from "./__common__.mjs";

const {
  JSON: { stringify: stringifyJSON },
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

export const createFrame = createEmptyFrame;

export const harvestFrameHeader = harvestEmptyFrameHeader;

export const harvestFramePrelude = harvestEmptyFramePrelude;

const checkTrailProgram = (trail, variable) => {
  expect1(
    !hasOwn(trail, "program"),
    EnclaveLimitationAranError,
    "Aran only support declaring external variables in script programs, got: %x",
    stringifyJSON,
    variable,
  );
};

export const declareFrame = (
  _strict,
  _frame,
  trail,
  kind,
  variable,
  options,
) => {
  if (includes(KINDS, kind)) {
    const { exports: specifiers } = options;
    checkTrailProgram(trail, variable);
    assert(
      specifiers.length === 0,
      "declare exported variable on enclave frame",
    );
    return null;
  } else {
    return trail;
  }
};

export const makeFrameInitializeStatementArray = (
  _strict,
  _frame,
  trail,
  kind,
  variable,
  expression,
) => {
  if (includes(KINDS, kind)) {
    checkTrailProgram(trail, variable);
    return [makeDeclareExternalStatement(mapping[kind], variable, expression)];
  } else {
    return trail;
  }
};

export const lookupFrameAll = lookupEmptyFrameAll;

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

export const makeFrameWriteEffectArray = (
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
    "Aran does not support assigning to external variables in non-strict mode, got: %x",
    stringifyJSON,
    variable,
  );
  incrementCounter(counter);
  return [makeWriteExternalEffect(variable, expression)];
};

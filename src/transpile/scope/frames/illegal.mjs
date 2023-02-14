import { includes } from "array-lite";

import {
  NULL_DATA_DESCRIPTOR,
  expect1,
  assert,
  constant_,
  constant___,
  hasOwn,
  SyntaxAranError,
} from "../../../util/index.mjs";

const {
  undefined,
  Reflect: { defineProperty },
} = globalThis;

const KINDS = ["illegal"];

export const createFrame = (_options) => ({ static: {} });

export const harvestFrameHeader = constant_([]);

export const harvestFramePrelude = constant_([]);

export const declareFrame = (
  _strict,
  { static: bindings },
  kind,
  variable,
  _options,
) => {
  if (includes(KINDS, kind)) {
    assert(!hasOwn(bindings, variable), "duplicate illegal variable");
    defineProperty(bindings, variable, NULL_DATA_DESCRIPTOR);
    return true;
  } else {
    return false;
  }
};

export const makeFrameInitializeStatementArray = (
  _strict,
  _frame,
  kind,
  _variable,
  _expression,
) => {
  assert(
    !includes(KINDS, kind),
    "illegal variables should never be initialized",
  );
  return null;
};

export const lookupFrameAll = constant___(undefined);

const makeLookupNode = (
  next,
  strict,
  { static: bindings },
  scope,
  escaped,
  variable,
  options,
) => {
  expect1(!hasOwn(bindings, variable), SyntaxAranError, "Illegal %s", variable);
  return next(strict, scope, escaped, variable, options);
};

export const makeFrameReadExpression = makeLookupNode;

export const makeFrameTypeofExpression = makeLookupNode;

export const makeFrameDiscardExpression = makeLookupNode;

export const makeFrameWriteEffect = makeLookupNode;

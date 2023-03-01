import { includes } from "array-lite";

import {
  NULL_DATA_DESCRIPTOR,
  expect1,
  assert,
  hasOwn,
  SyntaxAranError,
} from "../../../util/index.mjs";

import {
  harvestEmptyFrameHeader,
  harvestEmptyFramePrelude,
  lookupEmptyFrameAll,
} from "./helper.mjs";

const {
  JSON: { stringify: stringifyJSON },
  Reflect: { defineProperty },
} = globalThis;

const KINDS = ["illegal"];

export const createFrame = (_options) => ({ static: {} });

export const harvestFrameHeader = harvestEmptyFrameHeader;

export const harvestFramePrelude = harvestEmptyFramePrelude;

export const declareFrame = (
  _strict,
  { static: bindings },
  trail,
  kind,
  variable,
  _options,
) => {
  if (includes(KINDS, kind)) {
    assert(!hasOwn(bindings, variable), "duplicate illegal variable");
    defineProperty(bindings, variable, NULL_DATA_DESCRIPTOR);
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
  _variable,
  _expression,
) => {
  assert(
    !includes(KINDS, kind),
    "illegal variables should never be initialized",
  );
  return trail;
};

export const lookupFrameAll = lookupEmptyFrameAll;

const makeLookupNode = (
  next,
  strict,
  { static: bindings },
  scope,
  escaped,
  variable,
  options,
) => {
  expect1(
    !hasOwn(bindings, variable),
    SyntaxAranError,
    "Illegal %x",
    stringifyJSON,
    variable,
  );
  return next(strict, scope, escaped, variable, options);
};

export const makeFrameReadExpression = makeLookupNode;

export const makeFrameTypeofExpression = makeLookupNode;

export const makeFrameDiscardExpression = makeLookupNode;

export const makeFrameWriteEffect = makeLookupNode;

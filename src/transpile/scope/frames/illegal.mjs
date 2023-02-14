import {
  NULL_DATA_DESCRIPTOR,
  expect1,
  assert,
  constant_,
  constant___,
  deadcode_____,
  hasOwn,
  SyntaxAranError,
} from "../../../util/index.mjs";

const {
  undefined,
  Reflect: { defineProperty },
} = globalThis;

export const KINDS = ["illegal"];

export const createFrame = (_options) => ({ static: {} });

export const conflictFrame = (
  _strict,
  { static: bindings },
  _kind,
  variable,
) => {
  assert(!hasOwn(bindings, variable), "duplicate illegal variable");
};

export const harvestFrameHeader = constant_([]);

export const harvestFramePrelude = constant_([]);

export const declareFrame = (
  _strict,
  { static: bindings },
  _kind,
  variable,
  _options,
) => {
  assert(!hasOwn(bindings, variable), "duplicate illegal variable");
  defineProperty(bindings, variable, NULL_DATA_DESCRIPTOR);
};

export const makeFrameInitializeStatementArray = deadcode_____(
  "makeInitializeStatementArray called on illegal frame",
);

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

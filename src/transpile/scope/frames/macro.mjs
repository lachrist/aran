import { includes } from "array-lite";

import {
  NULL_DATA_DESCRIPTOR,
  assert,
  drop_x,
  return_x,
  constant__,
  constant_,
  constant___,
  hasOwn,
} from "../../../util/index.mjs";

import { makeLiteralExpression } from "../../../ast/index.mjs";

import { makeUnaryExpression } from "../../../intrinsic.mjs";

import { makeThrowConstantEffect } from "./helper.mjs";

const {
  undefined,
  Reflect: { defineProperty },
} = globalThis;

const KINDS = ["macro"];

export const createFrame = (_options) => ({ static: {} });

export const harvestFrameHeader = constant_([]);

export const harvestFramePrelude = constant_([]);

export const declareFrame = (
  _strict,
  { static: bindings },
  kind,
  variable,
  options,
) => {
  if (includes(KINDS, kind)) {
    const { macro } = options;
    assert(!hasOwn(bindings, variable), "duplicate macro variable");
    defineProperty(bindings, variable, {
      __proto__: NULL_DATA_DESCRIPTOR,
      value: macro,
    });
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
  assert(!includes(KINDS, kind), "macro variables should never be initialized");
  return null;
};

export const lookupFrameAll = constant___(undefined);

export const compileMakeLookupNode =
  (makePresentNode) =>
  (next, strict, { static: bindings }, scope, escaped, variable, options) => {
    if (hasOwn(bindings, variable)) {
      return makePresentNode(variable, bindings[variable]);
    } else {
      return next(strict, scope, escaped, variable, options);
    }
  };

export const makeFrameReadExpression = compileMakeLookupNode(return_x);

export const makeFrameTypeofExpression = compileMakeLookupNode(
  (_variable, macro) => makeUnaryExpression("typeof", macro),
);

export const makeFrameDiscardExpression = compileMakeLookupNode(
  constant__(makeLiteralExpression(false)),
);

export const makeFrameWriteEffect = compileMakeLookupNode(
  drop_x(makeThrowConstantEffect),
);

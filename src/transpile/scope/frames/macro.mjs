import { includes } from "array-lite";

import {
  NULL_DATA_DESCRIPTOR,
  assert,
  drop_x,
  return_x,
  constant__,
  hasOwn,
} from "../../../util/index.mjs";

import { makeLiteralExpression } from "../../../ast/index.mjs";

import { makeUnaryExpression } from "../../../intrinsic.mjs";

import {
  makeThrowConstantEffectArray,
  harvestEmptyFrameHeader,
  harvestEmptyFramePrelude,
  lookupEmptyFrameAll,
} from "./helper.mjs";

const {
  Reflect: { defineProperty },
} = globalThis;

const KINDS = ["macro"];

export const createFrame = (_options) => ({ static: {} });

export const harvestFrameHeader = harvestEmptyFrameHeader;

export const harvestFramePrelude = harvestEmptyFramePrelude;

export const declareFrame = (
  _strict,
  { static: bindings },
  trail,
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
  assert(!includes(KINDS, kind), "macro variables should never be initialized");
  return trail;
};

export const lookupFrameAll = lookupEmptyFrameAll;

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

export const makeFrameWriteEffectArray = compileMakeLookupNode(
  drop_x(makeThrowConstantEffectArray),
);

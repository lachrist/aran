import { includes } from "array-lite";

import {
  drop__x,
  NULL_DATA_DESCRIPTOR,
  hasOwn,
  constant_,
  partialx___,
  assert,
  constant___,
} from "../../../util/index.mjs";

import { makeLiteralExpression } from "../../../ast/index.mjs";

import {
  makeGetExpression,
  makeDeleteSloppyExpression,
} from "../../../intrinsic.mjs";

import { makeTypeofGetExpression, makeIncrementSetEffect } from "./helper.mjs";

const {
  undefined,
  Reflect: { defineProperty },
} = globalThis;

export const KINDS = ["define"];

export const createFrame = ({ macro, observable }) => ({
  dynamic: macro,
  static: {},
  observable,
});

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
    assert(!hasOwn(bindings, variable), "duplicate define variable");
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
  assert(!includes(KINDS, kind), "define variable should never be initialized");
  return null;
};

export const lookupFrameAll = constant___(undefined);

const compileMakeLookupNode =
  (makePresentNode) =>
  (
    next,
    strict,
    { static: bindings, dynamic: macro },
    scope,
    escaped,
    variable,
    options,
  ) => {
    if (hasOwn(bindings, variable)) {
      return makePresentNode(macro, makeLiteralExpression(variable), options);
    } else {
      return next(strict, scope, escaped, variable, options);
    }
  };

export const makeFrameReadExpression = compileMakeLookupNode(
  drop__x(makeGetExpression),
);

export const makeFrameTypeofExpression = compileMakeLookupNode(
  drop__x(makeTypeofGetExpression),
);

export const makeFrameDiscardExpression = compileMakeLookupNode(
  drop__x(makeDeleteSloppyExpression),
);

export const makeFrameWriteEffect = compileMakeLookupNode(
  partialx___(makeIncrementSetEffect, true),
);

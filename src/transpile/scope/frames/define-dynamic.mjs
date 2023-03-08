import { includes } from "array-lite";

import {
  drop__x,
  NULL_DATA_DESCRIPTOR,
  hasOwn,
  partialx___,
  assert,
} from "../../../util/index.mjs";

import { makeLiteralExpression } from "../../../ast/index.mjs";

import {
  makeGetExpression,
  makeDeleteSloppyExpression,
} from "../../../intrinsic.mjs";

import {
  makeTypeofGetExpression,
  makeIncrementSetEffectArray,
  harvestEmptyFrameHeader,
  harvestEmptyFramePrelude,
  lookupEmptyFrameAll,
} from "./__common__.mjs";

const {
  Reflect: { defineProperty },
} = globalThis;

export const KINDS = ["define"];

export const createFrame = ({ macro, observable }) => ({
  dynamic: macro,
  static: {},
  observable,
});

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
    assert(!hasOwn(bindings, variable), "duplicate define variable");
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
  assert(!includes(KINDS, kind), "define variable should never be initialized");
  return trail;
};

export const lookupFrameAll = lookupEmptyFrameAll;

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

export const makeFrameWriteEffectArray = compileMakeLookupNode(
  partialx___(makeIncrementSetEffectArray, true),
);

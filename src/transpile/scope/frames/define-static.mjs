import { includes, map } from "array-lite";

import {
  NULL_DATA_DESCRIPTOR,
  hasOwn,
  drop__x,
  assert,
  constant___,
} from "../../../util/index.mjs";

import {
  makeLiteralExpression,
  makeReadExpression,
} from "../../../ast/index.mjs";

import { mangleOriginalVariable } from "../variable.mjs";

import {
  makeTypeofReadExpression,
  makeIncrementWriteEffect,
  harvestEmptyFramePrelude,
  lookupEmptyFrameAll,
} from "./helper.mjs";

const {
  Reflect: { ownKeys, defineProperty },
} = globalThis;

export const KINDS = ["define"];

export const createFrame = (_options) => ({
  bindings: {},
});

export const harvestFrameHeader = ({ bindings }) =>
  map(ownKeys(bindings), mangleOriginalVariable);

export const harvestFramePrelude = harvestEmptyFramePrelude;

export const declareFrame = (
  _strict,
  { bindings },
  trail,
  kind,
  variable,
  _options,
) => {
  if (includes(KINDS, kind)) {
    assert(!includes(bindings, variable), "duplicate define variable");
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
    "define variables should never be initialized",
  );
  return trail;
};

export const lookupFrameAll = lookupEmptyFrameAll;

const compileMakeLookupNode =
  (makePresentNode) =>
  (next, strict, { bindings }, scope, escaped, variable, options) => {
    if (hasOwn(bindings, variable)) {
      return makePresentNode(mangleOriginalVariable(variable), options);
    } else {
      return next(strict, scope, escaped, variable, options);
    }
  };

export const makeFrameReadExpression = compileMakeLookupNode(
  drop__x(makeReadExpression),
);

export const makeFrameTypeofExpression = compileMakeLookupNode(
  drop__x(makeTypeofReadExpression),
);

export const makeFrameDiscardExpression = compileMakeLookupNode(
  constant___(makeLiteralExpression(false)),
);

export const makeFrameWriteEffect = compileMakeLookupNode(
  makeIncrementWriteEffect,
);

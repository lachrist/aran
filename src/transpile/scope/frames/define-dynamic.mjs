import {
  drop__x,
  NULL_DATA_DESCRIPTOR,
  hasOwn,
  constant_,
  partialx___,
  deadcode_____,
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

export const conflictFrame = (
  _strict,
  { static: bindings },
  _kind,
  variable,
) => {
  assert(!hasOwn(bindings, variable), "duplicate define variable");
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
  assert(!hasOwn(bindings, variable), "duplicate define variable");
  defineProperty(bindings, variable, NULL_DATA_DESCRIPTOR);
};

export const makeFrameInitializeStatementArray = deadcode_____(
  "makeInitializeStatementArray called on define-dynamic frame",
);

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

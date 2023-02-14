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

export const create = ({ macro, observable }) => ({
  dynamic: macro,
  static: {},
  observable,
});

export const conflict = (_strict, { static: bindings }, _kind, variable) => {
  assert(!hasOwn(bindings, variable), "duplicate define variable");
};

export const harvestHeader = constant_([]);

export const harvestPrelude = constant_([]);

export const declare = (
  _strict,
  { static: bindings },
  _kind,
  variable,
  _options,
) => {
  assert(!hasOwn(bindings, variable), "duplicate define variable");
  defineProperty(bindings, variable, NULL_DATA_DESCRIPTOR);
};

export const makeInitializeStatementArray = deadcode_____(
  "makeInitializeStatementArray called on define-dynamic frame",
);

export const lookupAll = constant___(undefined);

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

export const makeReadExpression = compileMakeLookupNode(
  drop__x(makeGetExpression),
);

export const makeTypeofExpression = compileMakeLookupNode(
  drop__x(makeTypeofGetExpression),
);

export const makeDiscardExpression = compileMakeLookupNode(
  drop__x(makeDeleteSloppyExpression),
);

export const makeWriteEffect = compileMakeLookupNode(
  partialx___(makeIncrementSetEffect, true),
);

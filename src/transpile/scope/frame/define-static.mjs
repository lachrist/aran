import { includes, map } from "array-lite";

import {
  NULL_DATA_DESCRIPTOR,
  hasOwn,
  drop__x,
  constant_,
  assert,
  deadcode_____,
  constant___,
} from "../../../util/index.mjs";

import {
  makeLiteralExpression,
  makeReadExpression as makeRawReadExpression,
} from "../../../ast/index.mjs";

import { mangleOriginalVariable } from "../variable.mjs";

import {
  makeTypeofReadExpression,
  makeIncrementWriteEffect,
} from "./helper.mjs";

const {
  undefined,
  Reflect: { ownKeys, defineProperty },
} = globalThis;

export const KINDS = ["define"];

export const create = (_options) => ({
  bindings: {},
});

export const conflict = (_strict, { bindings }, _kind, variable) => {
  assert(!hasOwn(bindings, variable), "duplicate define variable");
};

export const harvestHeader = ({ bindings }) =>
  map(ownKeys(bindings), mangleOriginalVariable);

export const harvestPrelude = constant_([]);

export const declare = (_strict, { bindings }, _kind, variable, _options) => {
  assert(!includes(bindings, variable), "duplicate define variable");
  defineProperty(bindings, variable, NULL_DATA_DESCRIPTOR);
};

export const makeInitializeStatementArray = deadcode_____(
  "makeInitializeStatementArray called on define-static frame",
);

export const lookupAll = constant___(undefined);

const compileMakeLookupNode =
  (makePresentNode) =>
  (next, strict, { bindings }, scope, escaped, variable, options) => {
    if (hasOwn(bindings, variable)) {
      return makePresentNode(mangleOriginalVariable(variable), options);
    } else {
      return next(strict, scope, escaped, variable, options);
    }
  };

export const makeReadExpression = compileMakeLookupNode(
  drop__x(makeRawReadExpression),
);

export const makeTypeofExpression = compileMakeLookupNode(
  drop__x(makeTypeofReadExpression),
);

export const makeDiscardExpression = compileMakeLookupNode(
  constant___(makeLiteralExpression(false)),
);

export const makeWriteEffect = compileMakeLookupNode(makeIncrementWriteEffect);

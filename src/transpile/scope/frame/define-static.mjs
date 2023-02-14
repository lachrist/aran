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
  makeReadExpression,
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

export const createFrame = (_options) => ({
  bindings: {},
});

export const conflictFrame = (_strict, { bindings }, _kind, variable) => {
  assert(!hasOwn(bindings, variable), "duplicate define variable");
};

export const harvestFrameHeader = ({ bindings }) =>
  map(ownKeys(bindings), mangleOriginalVariable);

export const harvestFramePrelude = constant_([]);

export const declareFrame = (
  _strict,
  { bindings },
  _kind,
  variable,
  _options,
) => {
  assert(!includes(bindings, variable), "duplicate define variable");
  defineProperty(bindings, variable, NULL_DATA_DESCRIPTOR);
};

export const makeFrameInitializeStatementArray = deadcode_____(
  "makeInitializeStatementArray called on define-static frame",
);

export const lookupFrameAll = constant___(undefined);

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

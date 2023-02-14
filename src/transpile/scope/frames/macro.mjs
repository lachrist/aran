import {
  NULL_DATA_DESCRIPTOR,
  assert,
  drop_x,
  return_x,
  constant__,
  constant_,
  constant___,
  deadcode_____,
  hasOwn,
} from "../../../util/index.mjs";

import { makeLiteralExpression } from "../../../ast/index.mjs";

import { makeUnaryExpression } from "../../../intrinsic.mjs";

import { makeThrowConstantEffect } from "./helper.mjs";

const {
  undefined,
  Reflect: { defineProperty },
} = globalThis;

export const KINDS = ["macro"];

export const createFrame = (_options) => ({ static: {} });

export const conflictFrame = (
  _strict,
  { static: bindings },
  _kind,
  variable,
) => {
  assert(!hasOwn(bindings, variable), "duplicate macro variable");
};

export const harvestFrameHeader = constant_([]);

export const harvestFramePrelude = constant_([]);

export const declareFrame = (
  _strict,
  { static: bindings },
  _kind,
  variable,
  { macro },
) => {
  assert(!hasOwn(bindings, variable), "duplicate macro variable");
  defineProperty(bindings, variable, {
    __proto__: NULL_DATA_DESCRIPTOR,
    value: macro,
  });
};

export const makeFrameInitializeStatementArray = deadcode_____(
  "makeInitializeStatementArray called on macro frame",
);

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

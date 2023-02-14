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

export const LAYERING = false;

export const create = (_options) => ({ static: {} });

export const conflict = (_strict, { static: bindings }, _kind, variable) => {
  assert(!hasOwn(bindings, variable), "duplicate intrinsic variable");
};

export const harvestHeader = constant_([]);

export const harvestPrelude = constant_([]);

export const declare = (
  _strict,
  { static: bindings },
  _kind,
  variable,
  { macro },
) => {
  assert(!hasOwn(bindings, variable), "duplicate intrinsic variable");
  defineProperty(bindings, variable, {
    __proto__: NULL_DATA_DESCRIPTOR,
    value: macro,
  });
};

export const makeInitializeStatementArray = deadcode_____(
  "makeInitializeStatementArray called on macro frame",
);

export const lookupAll = constant___(undefined);

export const compileMakeLookupNode =
  (makePresentNode) =>
  (next, strict, { static: bindings }, scope, escaped, variable, options) => {
    if (hasOwn(bindings, variable)) {
      return makePresentNode(variable, bindings[variable]);
    } else {
      return next(strict, scope, escaped, variable, options);
    }
  };

export const makeReadExpression = compileMakeLookupNode(return_x);

export const makeTypeofExpression = compileMakeLookupNode((_variable, macro) =>
  makeUnaryExpression("typeof", macro),
);

export const makeDiscardExpression = compileMakeLookupNode(
  constant__(makeLiteralExpression(false)),
);

export const makeWriteEffect = compileMakeLookupNode(
  drop_x(makeThrowConstantEffect),
);

import {
  NULL_DATA_DESCRIPTOR,
  expect1,
  constant___,
  constant_,
  hasOwn,
  dropx__,
  drop_xx,
  deadcode_____,
} from "../../../util/index.mjs";

import {
  makeImportExpression,
  makeLiteralExpression,
} from "../../../ast/index.mjs";

import {
  makeTypeofImportExpression,
  makeThrowConstantEffect,
  DuplicateError,
  DUPLICATE_TEMPLATE,
} from "./helper.mjs";

const {
  undefined,
  Reflect: { defineProperty },
} = globalThis;

export const KINDS = ["import"];

export const createFrame = (_options) => ({ static: {} });

export const conflictFrame = (
  _strict,
  { static: bindings },
  _kind,
  variable,
) => {
  expect1(
    !hasOwn(bindings, variable),
    DuplicateError,
    DUPLICATE_TEMPLATE,
    variable,
  );
};

export const harvestFrameHeader = constant_([]);

export const harvestFramePrelude = constant_([]);

export const declareFrame = (
  _strict,
  { static: bindings },
  _kind,
  variable,
  { source, specifier },
) => {
  expect1(
    !hasOwn(bindings, variable),
    DuplicateError,
    DUPLICATE_TEMPLATE,
    variable,
  );
  defineProperty(bindings, variable, {
    __proto__: NULL_DATA_DESCRIPTOR,
    value: { source, specifier },
  });
};

export const makeFrameInitializeStatementArray = deadcode_____(
  "makeInitializeStatementArray called on import-static frame",
);

export const lookupFrameAll = constant___(undefined);

const compileMakeLookupNode =
  (makePresentNode) =>
  (next, strict, { static: bindings }, scope, escaped, variable, options) => {
    if (hasOwn(bindings, variable)) {
      const { source, specifier } = bindings[variable];
      return makePresentNode(variable, source, specifier);
    } else {
      return next(strict, scope, escaped, variable, options);
    }
  };

export const makeFrameReadExpression = compileMakeLookupNode(
  dropx__(makeImportExpression),
);

export const makeFrameTypeofExpression = compileMakeLookupNode(
  dropx__(makeTypeofImportExpression),
);

export const makeFrameDiscardExpression = compileMakeLookupNode(
  constant___(makeLiteralExpression(false)),
);

export const makeFrameWriteEffect = compileMakeLookupNode(
  drop_xx(makeThrowConstantEffect),
);

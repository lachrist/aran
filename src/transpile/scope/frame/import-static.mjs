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

export const create = (_options) => ({ static: {} });

export const conflict = (_strict, { static: bindings }, _kind, variable) => {
  expect1(
    !hasOwn(bindings, variable),
    DuplicateError,
    DUPLICATE_TEMPLATE,
    variable,
  );
};

export const harvestHeader = constant_([]);

export const harvestPrelude = constant_([]);

export const declare = (
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

export const makeInitializeStatementArray = deadcode_____(
  "makeInitializeStatementArray called on import-static frame",
);

export const lookupAll = constant___(undefined);

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

export const makeReadExpression = compileMakeLookupNode(
  dropx__(makeImportExpression),
);

export const makeTypeofExpression = compileMakeLookupNode(
  dropx__(makeTypeofImportExpression),
);

export const makeDiscardExpression = compileMakeLookupNode(
  constant___(makeLiteralExpression(false)),
);

export const makeWriteEffect = compileMakeLookupNode(
  drop_xx(makeThrowConstantEffect),
);

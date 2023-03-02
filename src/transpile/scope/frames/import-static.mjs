import { includes } from "array-lite";

import {
  NULL_DATA_DESCRIPTOR,
  assert,
  expect1,
  constant___,
  hasOwn,
  dropx__,
  drop_xx,
} from "../../../util/index.mjs";

import {
  makeImportExpression,
  makeLiteralExpression,
} from "../../../ast/index.mjs";

import {
  makeTypeofImportExpression,
  makeThrowConstantEffectArray,
  DuplicateError,
  DUPLICATE_TEMPLATE,
  harvestEmptyFrameHeader,
  harvestEmptyFramePrelude,
  lookupEmptyFrameAll,
} from "./helper.mjs";

const {
  JSON: { stringify: stringifyJSON },
  Reflect: { defineProperty },
} = globalThis;

export const KINDS = ["import"];

export const createFrame = (_options) => ({ static: {} });

export const harvestFrameHeader = harvestEmptyFrameHeader;

export const harvestFramePrelude = harvestEmptyFramePrelude;

export const declareFrame = (
  _strict,
  { static: bindings },
  trail,
  kind,
  variable,
  options,
) => {
  expect1(
    !hasOwn(bindings, variable),
    DuplicateError,
    DUPLICATE_TEMPLATE,
    stringifyJSON,
    variable,
  );
  if (includes(KINDS, kind)) {
    const { source, specifier } = options;
    defineProperty(bindings, variable, {
      __proto__: NULL_DATA_DESCRIPTOR,
      value: { source, specifier },
    });
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
    "import variables should never be initialized",
  );
  return trail;
};

export const lookupFrameAll = lookupEmptyFrameAll;

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

export const makeFrameWriteEffectArray = compileMakeLookupNode(
  drop_xx(makeThrowConstantEffectArray),
);

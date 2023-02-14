import { concat, map, flatMap } from "array-lite";

import {
  NULL_DATA_DESCRIPTOR,
  partialx_,
  partial_x,
  drop_xx,
  constant___,
  constant____,
  pushAll,
  assert,
  hasOwn,
} from "../../../util/index.mjs";

import {
  makeEffectStatement,
  makeLiteralExpression,
  makeReadExpression,
  makeWriteEffect,
} from "../../../ast/index.mjs";

import { mangleOriginalVariable } from "../variable.mjs";

import {
  makeExportStatement,
  makeTypeofReadExpression,
  makeExportIncrementWriteEffect,
} from "./helper.mjs";

const {
  undefined,
  Reflect: { ownKeys, defineProperty },
} = globalThis;

export const KINDS = ["var", "function"];

export const createFrame = (_options) => ({
  bindings: {},
});

export const conflictFrame = constant____(undefined);

const makeDeclareStatementArray = (bindings, variable) =>
  concat(
    [
      makeEffectStatement(
        makeWriteEffect(
          mangleOriginalVariable(variable),
          makeLiteralExpression({ undefined: null }),
        ),
      ),
    ],
    map(
      bindings[variable],
      partial_x(
        makeExportStatement,
        makeLiteralExpression({ undefined: null }),
      ),
    ),
  );

export const harvestFrameHeader = ({ bindings }) =>
  map(ownKeys(bindings), mangleOriginalVariable);

export const harvestFramePrelude = ({ bindings }) =>
  flatMap(ownKeys(bindings), partialx_(makeDeclareStatementArray, bindings));

export const declareFrame = (
  _strict,
  { bindings },
  _kind,
  variable,
  { exports: specifiers },
) => {
  if (!hasOwn(bindings, variable)) {
    defineProperty(bindings, variable, {
      __proto__: NULL_DATA_DESCRIPTOR,
      value: [],
    });
  }
  pushAll(bindings[variable], specifiers);
};

export const makeFrameInitializeStatementArray = (
  _strict,
  { bindings },
  _kind,
  variable,
  expression,
) => {
  assert(hasOwn(bindings, variable), "missing variable for initialization");
  return concat(
    [
      makeEffectStatement(
        makeWriteEffect(mangleOriginalVariable(variable), expression),
      ),
    ],
    map(
      bindings[variable],
      partial_x(
        makeExportStatement,
        makeReadExpression(mangleOriginalVariable(variable)),
      ),
    ),
  );
};

export const lookupFrameAll = constant___(undefined);

const compileMakeLookupNode =
  (makePresentNode) =>
  (next, strict, { bindings }, scope, escaped, variable, options) => {
    if (hasOwn(bindings, variable)) {
      return makePresentNode(
        mangleOriginalVariable(variable),
        bindings[variable],
        options,
      );
    } else {
      return next(strict, scope, escaped, variable, options);
    }
  };

export const makeFrameReadExpression = compileMakeLookupNode(
  drop_xx(makeReadExpression),
);

export const makeFrameTypeofExpression = compileMakeLookupNode(
  drop_xx(makeTypeofReadExpression),
);

export const makeFrameDiscardExpression = compileMakeLookupNode(
  constant___(makeLiteralExpression(false)),
);

export const makeFrameWriteEffect = compileMakeLookupNode(
  makeExportIncrementWriteEffect,
);
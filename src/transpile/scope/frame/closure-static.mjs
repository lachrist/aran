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
  makeReadExpression as makeRawReadExpression,
  makeWriteEffect as makeRawWriteEffect,
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

export const create = (_options) => ({
  bindings: {},
});

export const conflict = constant____(undefined);

const makeDeclareStatementArray = (bindings, variable) =>
  concat(
    [
      makeEffectStatement(
        makeRawWriteEffect(
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

export const harvestHeader = ({ bindings }) =>
  map(ownKeys(bindings), mangleOriginalVariable);

export const harvestPrelude = ({ bindings }) =>
  flatMap(ownKeys(bindings), partialx_(makeDeclareStatementArray, bindings));

export const declare = (
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

export const makeInitializeStatementArray = (
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
        makeRawWriteEffect(mangleOriginalVariable(variable), expression),
      ),
    ],
    map(
      bindings[variable],
      partial_x(
        makeExportStatement,
        makeRawReadExpression(mangleOriginalVariable(variable)),
      ),
    ),
  );
};

export const lookupAll = constant___(undefined);

const compileMakeLookupNode =
  (makePresentNode) =>
  (next, _strict, _escaped, { bindings }, variable, options) => {
    if (hasOwn(bindings, variable)) {
      return makePresentNode(
        mangleOriginalVariable(variable),
        bindings[variable],
        options,
      );
    } else {
      return next();
    }
  };

export const makeReadExpression = compileMakeLookupNode(
  drop_xx(makeRawReadExpression),
);

export const makeTypeofExpression = compileMakeLookupNode(
  drop_xx(makeTypeofReadExpression),
);

export const makeDiscardExpression = compileMakeLookupNode(
  constant___(makeLiteralExpression(false)),
);

export const makeWriteEffect = compileMakeLookupNode(
  makeExportIncrementWriteEffect,
);

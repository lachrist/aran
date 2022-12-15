import { concat, reduce, map, flatMap } from "array-lite";

import {
  NULL_DATA_DESCRIPTOR,
  constant_,
  partialx_,
  partial_x,
  partial__x,
  partialxx_,
  partialxx______,
  constant___,
  pushAll,
  assert,
  hasOwnProperty,
} from "../../../util/index.mjs";

import {
  makeEffectStatement,
  makeLiteralExpression,
  makeReadExpression as makeRawReadExpression,
  makeWriteEffect as makeRawWriteEffect,
} from "../../../ast/index.mjs";

import { layerVariable } from "../variable.mjs";

import {
  makeExportSequenceEffect,
  makeExportStatement,
  makeStaticLookupNode,
  testStatic,
  makeStaticReadExpression,
  makeStaticTypeofExpression,
  makeStaticDiscardExpression,
  makeStaticWriteEffect,
} from "./helper.mjs";

const {
  undefined,
  Reflect: { ownKeys, defineProperty },
} = globalThis;

export const KINDS = ["var", "function"];

export const create = (layer, _options) => ({
  layer,
  static: {},
});

export const conflict = constant_(undefined);

const makeDeclareStatementArray = (bindings, layer, variable) =>
  concat(
    [
      makeEffectStatement(
        makeRawWriteEffect(
          layerVariable(layer, variable),
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

export const harvestHeader = ({ static: bindings, layer }) =>
  map(ownKeys(bindings), partialx_(layerVariable, layer));

export const harvestPrelude = ({ static: bindings, layer }) =>
  flatMap(
    ownKeys(bindings),
    partialxx_(makeDeclareStatementArray, bindings, layer),
  );

export const declare = (
  _strict,
  { static: bindings },
  _kind,
  variable,
  { exports: specifiers },
) => {
  if (!hasOwnProperty(bindings, variable)) {
    defineProperty(bindings, variable, {
      __proto__: NULL_DATA_DESCRIPTOR,
      value: [],
    });
  }
  pushAll(bindings[variable], specifiers);
};

export const makeInitializeStatementArray = (
  _strict,
  { static: bindings, layer },
  _kind,
  variable,
  expression,
) => {
  assert(
    hasOwnProperty(bindings, variable),
    "missing variable for initialization",
  );
  return concat(
    [
      makeEffectStatement(
        makeRawWriteEffect(layerVariable(layer, variable), expression),
      ),
    ],
    map(
      bindings[variable],
      partial_x(
        makeExportStatement,
        makeRawReadExpression(layerVariable(layer, variable)),
      ),
    ),
  );
};

export const lookupAll = constant___(undefined);

export const makeReadExpression = partialxx______(
  makeStaticLookupNode,
  testStatic,
  makeStaticReadExpression,
);

export const makeTypeofExpression = partialxx______(
  makeStaticLookupNode,
  testStatic,
  makeStaticTypeofExpression,
);

export const makeDiscardExpression = partialxx______(
  makeStaticLookupNode,
  testStatic,
  makeStaticDiscardExpression,
);

export const makeWriteEffect = partialxx______(
  makeStaticLookupNode,
  testStatic,
  (strict, escaped, frame, variable, options) => {
    const { static: bindings } = frame;
    return reduce(
      bindings[variable],
      partial__x(
        makeExportSequenceEffect,
        makeStaticReadExpression(strict, escaped, frame, variable, options),
      ),
      makeStaticWriteEffect(strict, escaped, frame, variable, options),
    );
  },
);

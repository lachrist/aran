import { concat, reduce, map, flatMap } from "array-lite";

import {
  NULL_DATA_DESCRIPTOR,
  constant_,
  partialx_,
  partial_x,
  partial__x,
  partialxx______,
  constant___,
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

export const create = (_options) => ({
  static: {},
});

export const conflict = constant_(undefined);

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

export const harvestHeader = ({ static: bindings }) =>
  map(ownKeys(bindings), mangleOriginalVariable);

export const harvestPrelude = ({ static: bindings }) =>
  flatMap(ownKeys(bindings), partialx_(makeDeclareStatementArray, bindings));

export const declare = (
  _strict,
  { static: bindings },
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
  { static: bindings },
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

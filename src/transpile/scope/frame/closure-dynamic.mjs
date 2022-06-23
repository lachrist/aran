import {map} from "array-lite";

import {
  hasOwnProperty,
  assert,
  constant_,
  constant___,
  partialx_,
  partialxxx______,
} from "../../../util/index.mjs";

import {
  makeEffectStatement,
  makeExpressionEffect,
  makeConditionalExpression,
  makeLiteralExpression,
} from "../../../ast/index.mjs";

import {
  makeSetExpression,
  makeDefineExpression,
  makeBinaryExpression,
  makeDataDescriptorExpression,
} from "../../../intrinsic.mjs";

import {
  NULL_DATA_DESCRIPTOR,
  testStatic,
  makeDynamicTestExpression,
  makeObservableDynamicTestExpression,
  makeDynamicLookupExpression,
  makeDynamicLookupEffect,
  makeDynamicReadExpression,
  makeDynamicTypeofExpression,
  makeDynamicDiscardExpression,
  makeDynamicWriteEffect,
} from "./helper.mjs";

const {
  undefined,
  Reflect: {ownKeys, defineProperty},
} = globalThis;

export const KINDS = ["var", "function"];

export const create = (_layer, {macro, observable}) => ({
  dynamic: macro,
  static: {},
  observable,
});

export const conflict = constant_(undefined);

const makeDeclareStatement = (dynamic, variable) =>
  makeEffectStatement(
    makeExpressionEffect(
      makeConditionalExpression(
        makeBinaryExpression("in", makeLiteralExpression(variable), dynamic),
        makeLiteralExpression({undefined: null}),
        makeDefineExpression(
          dynamic,
          makeLiteralExpression(variable),
          makeDataDescriptorExpression(
            makeLiteralExpression({undefined: null}),
            makeLiteralExpression(true),
            makeLiteralExpression(true),
            makeLiteralExpression(false),
          ),
        ),
      ),
    ),
  );

export const harvestHeader = constant_([]);

export const harvestPrelude = ({dynamic: expression, static: bindings}) =>
  map(ownKeys(bindings), partialx_(makeDeclareStatement, expression));

export const declare = (
  _strict,
  {static: bindings},
  _kind,
  variable,
  {exports: specifiers},
) => {
  assert(specifiers.length === 0, "unexpected global exported variable");
  if (!hasOwnProperty(bindings, variable)) {
    defineProperty(bindings, variable, NULL_DATA_DESCRIPTOR);
  }
};

export const makeInitializeStatementArray = (
  strict,
  {dynamic, static: bindings},
  _kind,
  variable,
  expression,
) => {
  assert(
    hasOwnProperty(bindings, variable),
    "missing binding for variable initialization",
  );
  return [
    makeEffectStatement(
      makeExpressionEffect(
        makeSetExpression(
          strict,
          dynamic,
          makeLiteralExpression(variable),
          expression,
        ),
      ),
    ),
  ];
};

export const lookupAll = constant___(undefined);

export const makeReadExpression = partialxxx______(
  makeDynamicLookupExpression,
  testStatic,
  makeDynamicTestExpression,
  makeDynamicReadExpression,
);

export const makeTypeofExpression = partialxxx______(
  makeDynamicLookupExpression,
  testStatic,
  makeDynamicTestExpression,
  makeDynamicTypeofExpression,
);

export const makeDiscardExpression = partialxxx______(
  makeDynamicLookupExpression,
  testStatic,
  makeDynamicTestExpression,
  makeDynamicDiscardExpression,
);

export const makeWriteEffect = partialxxx______(
  makeDynamicLookupEffect,
  testStatic,
  makeObservableDynamicTestExpression,
  makeDynamicWriteEffect,
);
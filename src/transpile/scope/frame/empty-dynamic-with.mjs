import {
  constant_,
  constant__,
  deadcode_____,
  constant___,
  partialxxx______,
  incrementCounter,
} from "../../../util/index.mjs";

import {
  makeConditionalExpression,
  makeLiteralExpression,
} from "../../../ast/index.mjs";

import {
  makeGetExpression,
  makeBinaryExpression,
  makeSymbolUnscopablesExpression,
} from "../../../intrinsic.mjs";

import {
  makeDynamicLookupExpression,
  makeDynamicLookupEffect,
  makeDynamicReadExpression,
  makeDynamicTypeofExpression,
  makeDynamicDiscardExpression,
  makeDynamicWriteEffect,
} from "./helper.mjs";

const { undefined } = globalThis;

export const KINDS = [];

export const create = ({ macro, observable }) => ({
  dynamic: macro,
  observable,
});

export const conflict = constant_(undefined);

export const harvestHeader = constant_([]);

export const harvestPrelude = constant_([]);

export const declare = deadcode_____("declaration on body-with frame");

export const makeInitializeStatements = deadcode_____(
  "initialization on body-with frame",
);

export const lookupAll = constant___(undefined);

const testStatic = constant__(false);

const makeDynamicTestExpression = ({ dynamic }, variable, _options) =>
  makeConditionalExpression(
    makeGetExpression(dynamic, makeSymbolUnscopablesExpression()),
    makeConditionalExpression(
      makeGetExpression(
        makeGetExpression(dynamic, makeSymbolUnscopablesExpression()),
        makeLiteralExpression(variable),
      ),
      makeLiteralExpression(false),
      makeBinaryExpression("in", makeLiteralExpression(variable), dynamic),
    ),
    makeBinaryExpression("in", makeLiteralExpression(variable), dynamic),
  );

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

const makeObservableDynamicTestExpression = (frame, variable, options) => {
  const { observable } = frame;
  if (observable) {
    const { counter } = options;
    incrementCounter(counter);
    incrementCounter(counter);
  }
  return makeDynamicTestExpression(frame, variable, options);
};

export const makeWriteEffect = partialxxx______(
  makeDynamicLookupEffect,
  testStatic,
  makeObservableDynamicTestExpression,
  makeDynamicWriteEffect,
);

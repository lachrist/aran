import {
  noop_,
  dropx__x,
  constant_,
  constant_____,
  constant___,
  incrementCounter,
} from "../../../util/index.mjs";

import {
  makeConditionalEffect,
  makeConditionalExpression,
  makeLiteralExpression,
} from "../../../ast/index.mjs";

import {
  makeGetExpression,
  makeBinaryExpression,
  makeSymbolUnscopablesExpression,
  makeDeleteSloppyExpression,
} from "../../../intrinsic.mjs";

import { makeTypeofGetExpression, makeIncrementSetEffect } from "./helper.mjs";

const { undefined } = globalThis;

export const KINDS = [];

export const createFrame = ({ macro, observable }) => ({
  dynamic: macro,
  observable,
});

export const harvestFrameHeader = constant_([]);

export const harvestFramePrelude = constant_([]);

export const declareFrame = constant_____(false);

export const makeFrameInitializeStatementArray = constant_____(null);

export const lookupFrameAll = constant___(undefined);

const compileMakeLookupNode =
  (makeConditionalNode, makePresentNode, observe) =>
  (
    next,
    strict,
    { dynamic: macro, observable },
    scope,
    escaped,
    variable,
    options,
  ) => {
    if (observable) {
      observe(options);
    }
    return makeConditionalNode(
      makeConditionalExpression(
        makeGetExpression(macro, makeSymbolUnscopablesExpression()),
        makeConditionalExpression(
          makeGetExpression(
            makeGetExpression(macro, makeSymbolUnscopablesExpression()),
            makeLiteralExpression(variable),
          ),
          makeLiteralExpression(false),
          makeBinaryExpression("in", makeLiteralExpression(variable), macro),
        ),
        makeBinaryExpression("in", makeLiteralExpression(variable), macro),
      ),
      makePresentNode(strict, macro, makeLiteralExpression(variable), options),
      next(strict, scope, escaped, variable, options),
    );
  };

export const makeFrameReadExpression = compileMakeLookupNode(
  makeConditionalExpression,
  dropx__x(makeGetExpression),
  noop_,
);

export const makeFrameTypeofExpression = compileMakeLookupNode(
  makeConditionalExpression,
  dropx__x(makeTypeofGetExpression),
  noop_,
);

export const makeFrameDiscardExpression = compileMakeLookupNode(
  makeConditionalExpression,
  dropx__x(makeDeleteSloppyExpression),
  noop_,
);

export const makeFrameWriteEffect = compileMakeLookupNode(
  makeConditionalEffect,
  makeIncrementSetEffect,
  ({ counter }) => {
    incrementCounter(counter);
    incrementCounter(counter);
  },
);

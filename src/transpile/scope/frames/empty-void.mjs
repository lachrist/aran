import {
  incrementCounter,
  constant_,
  constant_____,
  dropxxxxx_x,
  constant_______,
  constant___,
} from "../../../util/index.mjs";

import {
  makeLiteralExpression,
  makeExpressionEffect,
} from "../../../ast/index.mjs";

import { makeSetExpression } from "../../../intrinsic.mjs";

import { makeThrowMissingExpression } from "./helper.mjs";

const { undefined } = globalThis;

export const createFrame = ({ macro }) => ({
  dynamic: macro,
});

export const harvestFrameHeader = constant_([]);

export const harvestFramePrelude = constant_([]);

export const declareFrame = constant_____(false);

export const makeFrameInitializeStatementArray = constant_____(null);

export const lookupFrameAll = constant___(undefined);

export const makeFrameReadExpression = dropxxxxx_x(makeThrowMissingExpression);

export const makeFrameTypeofExpression = constant_______(
  makeLiteralExpression("undefined"),
);

export const makeFrameDiscardExpression = constant_______(
  makeLiteralExpression(true),
);

export const makeFrameWriteEffect = (
  _next,
  strict,
  { dynamic: macro },
  _scope,
  _escaped,
  variable,
  { counter, expression },
) => {
  if (strict) {
    return makeExpressionEffect(makeThrowMissingExpression(variable));
  } else {
    incrementCounter(counter);
    return makeExpressionEffect(
      makeSetExpression(
        strict,
        macro,
        makeLiteralExpression(variable),
        expression,
      ),
    );
  }
};

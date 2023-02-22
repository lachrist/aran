import {
  incrementCounter,
  dropxxxxx_x,
  constant_______,
} from "../../../util/index.mjs";

import {
  makeLiteralExpression,
  makeExpressionEffect,
} from "../../../ast/index.mjs";

import { makeSetExpression } from "../../../intrinsic.mjs";

import {
  makeThrowMissingExpression,
  harvestEmptyFrameHeader,
  harvestEmptyFramePrelude,
  declareEmptyFrame,
  makeEmptyFrameInitializeStatementArray,
  lookupEmptyFrameAll,
} from "./helper.mjs";

export const createFrame = ({ macro }) => ({
  dynamic: macro,
});

export const harvestFrameHeader = harvestEmptyFrameHeader;

export const harvestFramePrelude = harvestEmptyFramePrelude;

export const declareFrame = declareEmptyFrame;

export const makeFrameInitializeStatementArray =
  makeEmptyFrameInitializeStatementArray;

export const lookupFrameAll = lookupEmptyFrameAll;

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

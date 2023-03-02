import { dropxxxxx_x, constant_______ } from "../../../util/index.mjs";

import { makeLiteralExpression } from "../../../ast/index.mjs";

import {
  makeIncrementSetEffectArray,
  makeThrowMissingEffectArray,
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

export const makeFrameWriteEffectArray = (
  _next,
  strict,
  { dynamic: macro },
  _scope,
  _escaped,
  variable,
  options,
) => {
  if (strict) {
    return makeThrowMissingEffectArray(variable);
  } else {
    return makeIncrementSetEffectArray(
      strict,
      macro,
      makeLiteralExpression(variable),
      options,
    );
  }
};

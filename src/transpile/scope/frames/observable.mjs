import { incrementCounter } from "../../../util/index.mjs";

import {
  createEmptyFrame,
  harvestEmptyFrameHeader,
  harvestEmptyFramePrelude,
  declareEmptyFrame,
  makeEmptyFrameInitializeStatementArray,
  lookupEmptyFrameAll,
  makeEmptyFrameReadExpression,
  makeEmptyFrameTypeofExpression,
  makeEmptyFrameDiscardExpression,
} from "./helper.mjs";

export const createFrame = createEmptyFrame;

export const harvestFrameHeader = harvestEmptyFrameHeader;

export const harvestFramePrelude = harvestEmptyFramePrelude;

export const declareFrame = declareEmptyFrame;

export const makeFrameInitializeStatementArray =
  makeEmptyFrameInitializeStatementArray;

export const lookupFrameAll = lookupEmptyFrameAll;

export const makeFrameReadExpression = makeEmptyFrameReadExpression;

export const makeFrameTypeofExpression = makeEmptyFrameTypeofExpression;

export const makeFrameDiscardExpression = makeEmptyFrameDiscardExpression;

export const makeFrameWriteEffect = (
  makeScopeWriteEffect,
  strict,
  _frame,
  scope,
  escaped,
  variable,
  options,
) => {
  incrementCounter(options.counter);
  incrementCounter(options.counter);
  return makeScopeWriteEffect(strict, scope, escaped, variable, options);
};

import { incrementCounter } from "../../../util/index.mjs";

import {
  createEmptyFrame,
  harvestEmptyFrameHeader,
  harvestEmptyFramePrelude,
  declareEmptyFrame,
  makeEmptyFrameInitializeStatementArray,
  lookupEmptyFrameAll,
  makeEmptyFrameLookupNode,
} from "./__common__.mjs";

export const createFrame = createEmptyFrame;

export const harvestFrameHeader = harvestEmptyFrameHeader;

export const harvestFramePrelude = harvestEmptyFramePrelude;

export const declareFrame = declareEmptyFrame;

export const makeFrameInitializeStatementArray =
  makeEmptyFrameInitializeStatementArray;

export const lookupFrameAll = lookupEmptyFrameAll;

export const makeFrameReadExpression = makeEmptyFrameLookupNode;

export const makeFrameTypeofExpression = makeEmptyFrameLookupNode;

export const makeFrameDiscardExpression = makeEmptyFrameLookupNode;

export const makeFrameWriteEffectArray = (
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

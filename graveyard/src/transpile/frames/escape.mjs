import {
  createEmptyFrame,
  harvestEmptyFrameHeader,
  harvestEmptyFramePrelude,
  declareEmptyFrame,
  makeEmptyFrameInitializeStatementArray,
  lookupEmptyFrameAll,
} from "./__common__.mjs";

export const createFrame = createEmptyFrame;

export const harvestFrameHeader = harvestEmptyFrameHeader;

export const harvestFramePrelude = harvestEmptyFramePrelude;

export const declareFrame = declareEmptyFrame;

export const makeFrameInitializeStatementArray =
  makeEmptyFrameInitializeStatementArray;

export const lookupFrameAll = lookupEmptyFrameAll;

export const makeLookupNode = (
  next,
  strict,
  _frame,
  scope,
  _escaped,
  variable,
  options,
) => next(strict, scope, true, variable, options);

export const makeFrameReadExpression = makeLookupNode;

export const makeFrameTypeofExpression = makeLookupNode;

export const makeFrameDiscardExpression = makeLookupNode;

export const makeFrameWriteEffectArray = makeLookupNode;

import {
  harvestEmptyFrameHeader,
  harvestEmptyFramePrelude,
  lookupEmptyFrameAll,
  makeEmptyFrameReadExpression,
  makeEmptyFrameTypeofExpression,
  makeEmptyFrameDiscardExpression,
  makeEmptyFrameWriteEffect,
} from "./helper.mjs";

export const createFrame = ({ key }) => ({ key });

export const harvestFrameHeader = harvestEmptyFrameHeader;

export const harvestFramePrelude = harvestEmptyFramePrelude;

export const declareFrame = (
  _strict,
  { key },
  trail,
  _kind,
  _variable,
  _options,
) => ({
  ...trail,
  [key]: null,
});

export const makeFrameInitializeStatementArray = (
  _strict,
  { key },
  trail,
  _kind,
  _variable,
  _expression,
) => ({
  ...trail,
  [key]: null,
});

export const lookupFrameAll = lookupEmptyFrameAll;

export const makeFrameReadExpression = makeEmptyFrameReadExpression;

export const makeFrameTypeofExpression = makeEmptyFrameTypeofExpression;

export const makeFrameDiscardExpression = makeEmptyFrameDiscardExpression;

export const makeFrameWriteEffect = makeEmptyFrameWriteEffect;

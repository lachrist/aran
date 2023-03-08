import {
  harvestEmptyFrameHeader,
  harvestEmptyFramePrelude,
  lookupEmptyFrameAll,
  makeEmptyFrameLookupNode,
} from "./__common__.mjs";

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

export const makeFrameReadExpression = makeEmptyFrameLookupNode;

export const makeFrameTypeofExpression = makeEmptyFrameLookupNode;

export const makeFrameDiscardExpression = makeEmptyFrameLookupNode;

export const makeFrameWriteEffectArray = makeEmptyFrameLookupNode;

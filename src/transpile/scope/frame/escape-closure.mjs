import {
  constant_,
  constant___,
  constant____,
  deadcode_____,
  deadcode______,
} from "../../../util/index.mjs";

const { undefined } = globalThis;

export const KINDS = [];

export const createFrame = ({}) => ({});

export const conflictFrame = constant____(undefined);

export const declareFrame = deadcode_____("declare called on empty-void frame");

export const harvestFrameHeader = constant_([]);

export const harvestFramePrelude = constant_([]);

export const declareFrameFrame = deadcode______(
  "declareFrame called on closure frame",
);

export const makeFrameInitializeStatementArray = deadcode_____(
  "makeFrameInitializeStatementArray called on closure frame",
);

export const lookupFrameAll = constant___(true);

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

export const makeFrameWriteEffect = makeLookupNode;

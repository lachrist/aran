import {
  constant_,
  constant___,
  constant____,
  deadcode_____,
  deadcode______,
} from "../../../util/index.mjs";

const { undefined } = globalThis;

export const KINDS = [];

export const create = ({}) => ({});

export const conflict = constant____(undefined);

export const declare = deadcode_____("declare called on empty-void frame");

export const harvestHeader = constant_([]);

export const harvestPrelude = constant_([]);

export const declareFrame = deadcode______(
  "declareFrame called on closure frame",
);

export const makeInitializeStatementArray = deadcode_____(
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

export const makeReadExpression = makeLookupNode;

export const makeTypeofExpression = makeLookupNode;

export const makeDiscardExpression = makeLookupNode;

export const makeWriteEffect = makeLookupNode;

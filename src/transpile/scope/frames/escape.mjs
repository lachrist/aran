import { constant_, constant___, return__x___ } from "../../../util/index.mjs";

export const createFrame = ({}) => ({});

export const harvestFrameHeader = constant_([]);

export const harvestFramePrelude = constant_([]);

export const declareFrame = return__x___;

export const makeFrameInitializeStatementArray = return__x___;

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

import { constant_, return__x } from "../../../util/index.mjs";

export const createFrame = ({ key }) => ({ key });

export const harvestFrameHeader = constant_([]);

export const harvestFramePrelude = constant_([]);

export const declareFrame = (
  _strict,
  { key },
  trail,
  _kind,
  _variable,
  _options,
) => ({
  ...trail,
  [key]: true,
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
  [key]: true,
});

export const lookupFrameAll = return__x;

const makeLookupNode = (
  next,
  strict,
  _frame,
  scope,
  escaped,
  variable,
  options,
) => next(strict, scope, escaped, variable, options);

export const makeFrameReadExpression = makeLookupNode;

export const makeFrameTypeofExpression = makeLookupNode;

export const makeFrameDiscardExpression = makeLookupNode;

export const makeFrameWriteEffect = makeLookupNode;

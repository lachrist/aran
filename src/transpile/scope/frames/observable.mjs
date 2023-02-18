import {
  incrementCounter,
  constant_,
  constant___,
  constant_____,
} from "../../../util/index.mjs";

const { undefined } = globalThis;

export const createFrame = constant_({});

export const harvestFrameHeader = constant_([]);

export const harvestFramePrelude = constant_([]);

export const declareFrame = constant_____(false);

export const makeFrameInitializeStatementArray = constant_____(null);

export const lookupFrameAll = constant___(undefined);

const makeFrameLookupExpression = (
  makeScopeLookupExpression,
  strict,
  _frame,
  scope,
  escaped,
  variable,
  options,
) => makeScopeLookupExpression(strict, scope, escaped, variable, options);

export const makeFrameReadExpression = makeFrameLookupExpression;

export const makeFrameTypeofExpression = makeFrameLookupExpression;

export const makeFrameDiscardExpression = makeFrameLookupExpression;

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

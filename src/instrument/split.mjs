import {
  declareScope,
  lookupScope,
  isScopeUsed,
  makeScopeReadExpression,
  makeScopeWriteEffect,
} from "./scope.mjs";

export const VAR_SPLIT = "V";
export const LAB_SPLIT = "L";
export const OLD_SPLIT = "O";
export const NEW_SPLIT = "N";

export const declareSplitScope = (scope, prefix, variable, note) =>
  declareScope(scope, `${prefix}${variable}`, note);

export const lookupSplitScope = (scope, prefix, variable) =>
  lookupScope(scope, `${prefix}${variable}`);

export const isSplitScopeUsed = (scope, prefix, variable) =>
  isScopeUsed(scope, `${prefix}${variable}`);

export const makeSplitScopeReadExpression = (scope, prefix, variable) =>
  makeScopeReadExpression(scope, `${prefix}${variable}`);

export const makeSplitScopeWriteEffect = (
  scope,
  prefix,
  variable,
  expression,
) => makeScopeWriteEffect(scope, `${prefix}${variable}`, expression);

import { flatMap, map } from "array-lite";

import { append, partialx_, partial_x } from "../util/index.mjs";

import {
  useScope,
  declareScope,
  lookupScope,
  isScopeUsed,
  makeScopeReadExpression,
  makeScopeWriteEffect,
  makeScopeEvalExpression,
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

export const useSplitScope = (scope, prefix, variable) =>
  useScope(scope, `${prefix}${variable}`);

export const makeSplitScopeReadExpression = (scope, prefix, variable) =>
  makeScopeReadExpression(scope, `${prefix}${variable}`);

export const makeSplitScopeWriteEffect = (
  scope,
  prefix,
  variable,
  expression,
) => makeScopeWriteEffect(scope, `${prefix}${variable}`, expression);

const appendAll = (prefix, strings) => map(strings, partialx_(append, prefix));

export const makeSplitScopeEvalExpression = (
  scope,
  prefixes,
  variables,
  expression,
) =>
  makeScopeEvalExpression(
    scope,
    flatMap(prefixes, partial_x(appendAll, variables)),
    expression,
  );

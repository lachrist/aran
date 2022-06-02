import {assert, dropx_x___, constant_} from "../../../util/index.mjs";

import {
  makeEffectStatement,
  makeLiteralExpression,
  makeExpressionEffect,
} from "../../../ast/index.mjs";

import {makeSetStrictExpression} from "../../../intrinsic.mjs";

import {
  makeDynamicLookupExpression,
  makeDynamicLookupEffect,
} from "./helper.mjs";

export const create = (_layer, {dynamic}) => dynamic;

export const harvest = constant_({prelude: [], header: []});

export const makeDeclareStatements = (
  _strict,
  _frame,
  _kind,
  _variable,
  iimport,
  eexports,
) => {
  assert(iimport === null, "unexpected imported declaration");
  assert(eexports.length === 0, "unexpected exported declaration");
  return [];
};

export const makeInitializeStatements = (
  _strict,
  frame,
  _kind,
  variable,
  expression,
) => [
  makeEffectStatement(
    makeExpressionEffect(
      makeSetStrictExpression(
        frame,
        makeLiteralExpression(variable),
        expression,
      ),
    ),
  ),
];

export const makeLookupExpression = dropx_x___(makeDynamicLookupExpression);

export const makeLookupEffect = dropx_x___(makeDynamicLookupEffect);

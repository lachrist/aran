import {assert, constant_} from "../../../util/index.mjs";

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

const {undefined} = globalThis;

export const KINDS = ["def"];

export const create = (_layer, {dynamic}) => ({dynamic});

export const conflict = constant_(undefined);

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
  {dynamic},
  _kind,
  variable,
  expression,
) => [
  makeEffectStatement(
    makeExpressionEffect(
      makeSetStrictExpression(
        dynamic,
        makeLiteralExpression(variable),
        expression,
      ),
    ),
  ),
];

export const generateMakeLookupNode =
  (makeDynamicLookupNode) =>
  (_next, strict, _escaped, {dynamic}, variable, right) =>
    makeDynamicLookupNode(strict, dynamic, variable, right, false);

export const makeLookupExpression = generateMakeLookupNode(
  makeDynamicLookupExpression,
);

export const makeLookupEffect = generateMakeLookupNode(makeDynamicLookupEffect);

import {assert, constant_} from "../../../util/index.mjs";

import {
  makeEffectStatement,
  makeExpressionEffect,
  makeConditionalExpression,
  makeLiteralExpression,
  makeConditionalEffect,
} from "../../../ast/index.mjs";

import {
  makeDefineExpression,
  makeBinaryExpression,
  makeDataDescriptorExpression,
} from "../../../intrinsic.mjs";

import {makeWrite} from "../right.mjs";

import {
  makeDynamicLookupExpression,
  makeDynamicLookupEffect,
} from "./helper.mjs";

const {undefined} = globalThis;

export const KINDS = ["var", "function"];

export const create = (_layer, {dynamic, observable}) => ({
  dynamic,
  observable,
});

export const conflict = constant_(undefined);

export const harvest = constant_({
  header: [],
  prelude: [],
});

export const makeDeclareStatements = (
  _strict,
  {dynamic},
  _kind,
  variable,
  {exports: eexports},
) => {
  assert(eexports.length === 0, "unexpected global exported variable");
  return [
    makeEffectStatement(
      makeExpressionEffect(
        makeConditionalExpression(
          makeBinaryExpression("in", makeLiteralExpression(variable), dynamic),
          makeLiteralExpression({undefined: null}),
          makeDefineExpression(
            dynamic,
            makeLiteralExpression(variable),
            makeDataDescriptorExpression(
              makeLiteralExpression({undefined: null}),
              makeLiteralExpression(true),
              makeLiteralExpression(true),
              makeLiteralExpression(false),
            ),
          ),
        ),
      ),
    ),
  ];
};

export const makeInitializeStatements = (
  strict,
  {dynamic},
  _kind,
  variable,
  expression,
) => [
  makeEffectStatement(
    makeDynamicLookupEffect(
      strict,
      dynamic,
      variable,
      makeWrite(expression),
      false,
    ),
  ),
];

export const generateMakeLookupNode =
  (makeConditionalNode, makeDynamicLookupNode) =>
  (next, strict, _escaped, {dynamic, observable}, variable, right) =>
    makeConditionalNode(
      makeBinaryExpression("in", makeLiteralExpression(variable), dynamic),
      makeDynamicLookupNode(strict, dynamic, variable, right, observable),
      next(),
    );

export const makeLookupEffect = generateMakeLookupNode(
  makeConditionalEffect,
  makeDynamicLookupEffect,
);

export const makeLookupExpression = generateMakeLookupNode(
  makeConditionalExpression,
  makeDynamicLookupExpression,
);

import {map, includes} from "array-lite";

import {push, assert, partialx_} from "../../../util/index.mjs";

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
  makeGetExpression,
  makeDataDescriptorExpression,
  makeDeadzoneExpression,
} from "../../../intrinsic.mjs";

import {isDiscard} from "../right.mjs";

import {
  makeDynamicLookupExpression,
  makeDynamicLookupEffect,
  makeThrowDeadzoneExpression,
  makeThrowDuplicateExpression,
} from "./helper.mjs";

export const KINDS = ["let", "const", "class"];

export const create = (_layer, _options) => ({});

export const harvest = constant_({
  header: [],
  prelude: [],
});

export const makeDeclareStatements = (
  _strict,
  {dynamic},
  _kind,
  variable,
  iimport,
  eexports,
) => {
  assert(iimport === null, "unexpected global imported variable");
  assert(eexports.length === 0, "unexpected global exported variable");
  return [
    makeEffectStatement(
      makeExpressionEffect(
        makeDefineExpression(
          dynamic,
          makeLiteralExpression(variable),
          makeDataDescriptorExpression(
            makeDeadzoneExpression(),
            makeLiteralExpression(true),
            makeLiteralExpression(true),
            makeLiteralExpression(false),
          ),
        ),
      ),
    ),
  ];
};

export const makeInitializeStatements = (
  _strict,
  {dynamic},
  kind,
  variable,
  expression,
) => [
    makeEffectStatement(
      makeExpressionEffect(
        makeDefineExpression(
          dynamic,
          makeLiteralExpression(variable),
          makeDataDescriptorExpression(
            expression,
            makeLiteralExpression(kind !== "const"),
            makeLiteralExpression(true),
            makeLiteralExpression(false),
          ),
        ),
      ),
    ),
  ];

export const generateMakeLookupNode = (
  makeConditionalNode,
  makeDynamicLookupNode,
  makeLiftNode,
) => (
  next,
  strict,
  _escaped,
  {dynamic},
  variable,
  right,
) =>
  makeConditionalNode(
    makeBinaryExpression("in", makeLiteralExpression(variable), dynamic),
    isDiscard(right)
      ? makeDynamicLookupNode(strict, dynamic, variable, right)
      : makeConditionalExpression(
          makeBinaryExpression(
            "===",
            makeGetExpression(dynamic, makeLiteralExpression(variable)),
            makeDeadzoneExpression(),
          ),
          makeLiftNode(makeThrowDeadzoneExpression(variable)),
          makeDynamicLookupNode(strict, dynamic, variable, right),
        ),
    next(),
  );

export const makeLookupEffect = generateMakeLookupNode(
  makeConditionalEffect,
  makeDynamicLookupEffect,
  makeExpressionEffect,
);

export const makeLookupExpression = generateMakeLookupNode(
  makeConditionalExpression,
  makeDynamicLookupExpression,
  makeExpressionExpression,
);

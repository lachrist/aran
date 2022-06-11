import {includes, map} from "array-lite";

import {push, returnx, assert, partialx_} from "../../../util/index.mjs";

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

const makeConflictStatement = (dynamic, variable) =>
  makeEffectStatement(
    makeExpressionEffect(
      makeConditionalExpression(
        makeBinaryExpression("in", makeLiteralExpression(variable), dynamic),
        makeThrowDuplicateExpression(variable),
        makeLiteralExpression({undefined: null}),
      ),
    ),
  );

export const KINDS = ["let", "const", "class"];

export const create = (_layer, {dynamic, observable}) => ({
  dynamic,
  observable,
  conflicts: [],
});

export const conflict = (_strict, {conflicts}, _kind, variable) => {
  if (!includes(conflicts, variable)) {
    push(conflicts, variable);
  }
};

export const harvest = ({dynamic, conflicts}) => ({
  header: [],
  prelude: map(conflicts, partialx_(makeConflictStatement, dynamic)),
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

export const generateMakeLookupNode =
  (makeConditionalNode, makeDynamicLookupNode, makeLiftNode) =>
  (next, strict, _escaped, {dynamic, observable}, variable, right) =>
    makeConditionalNode(
      makeBinaryExpression("in", makeLiteralExpression(variable), dynamic),
      isDiscard(right)
        ? makeDynamicLookupNode(strict, dynamic, variable, right)
        : makeConditionalNode(
            makeBinaryExpression(
              "===",
              makeGetExpression(dynamic, makeLiteralExpression(variable)),
              makeDeadzoneExpression(),
            ),
            makeLiftNode(makeThrowDeadzoneExpression(variable)),
            makeDynamicLookupNode(strict, dynamic, variable, right, observable),
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
  returnx,
);

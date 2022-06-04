import {map, includes} from "array-lite";

import {push, assert, partialx_, deadcode_____} from "../../../util/index.mjs";

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

import {
  makeThrowDuplicateExpression,
  makeDynamicLookupExpression,
  makeDynamicLookupEffect,
} from "./helper.mjs";

const makeConflictStatement = (conflict, variable) =>
  makeEffectStatement(
    makeExpressionEffect(
      makeConditionalExpression(
        makeBinaryExpression("in", makeLiteralExpression(variable), conflict),
        makeThrowDuplicateExpression(variable),
        makeLiteralExpression({undefined: null}),
      ),
    ),
  );

export const KINDS = ["var", "function"];

export const create = (_layer, {dynamic, conflict}) => ({
  dynamic,
  conflict,
  bindings: [],
});

export const harvest = ({conflict, bindings}) => ({
  header: [],
  prelude: map(bindings, partialx_(makeConflictStatement, conflict)),
});

export const makeDeclareStatements = (
  _strict,
  {dynamic, bindings},
  _kind,
  variable,
  iimport,
  eexports,
) => {
  if (!includes(bindings, variable)) {
    push(bindings, variable);
  }
  assert(iimport === null, "unexpected global imported variable");
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

export const makeInitializeStatements = deadcode_____(
  "var/function variables should not be initialized",
);

export const generateMakeLookupNode =
  (makeConditionalNode, makeDynamicLookupNode) =>
  (next, strict, _escaped, {dynamic}, variable, right) =>
    makeConditionalNode(
      makeBinaryExpression("in", makeLiteralExpression(variable), dynamic),
      makeDynamicLookupNode(strict, dynamic, variable, right),
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

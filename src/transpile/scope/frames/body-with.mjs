import {
  constant_____,
  constant______,
  constant_,
} from "../../../util/index.mjs";

import {
  makeConditionalExpression,
  makeLiteralExpression,
  makeConditionalEffect,
} from "../../../ast/index.mjs";

import {
  makeGetExpression,
  makeBinaryExpression,
  makeSymbolUnscopablesExpression,
} from "../../../intrinsic.mjs";

import {
  makeDynamicLookupExpression,
  makeDynamicLookupEffect,
} from "./helper.mjs";

export const KINDS = [];

export const create = (_layer, {dynamic}) => ({dynamic});

export const harvest = constant_({prelude: [], header: []});

export const makeDeclareStatements = deadcode______("this should never happen");

export const makeInitializeStatements = deadcode_____("this should never happen");

const generateMakeLookupNode =
  (makeConditionalNode, makeDynamicLookupNode) =>
  (next, strict, _escaped, {dynamic}, variable, right) =>
    makeConditionalNode(
      makeConditionalExpression(
        makeGetExpression(dynamic, makeSymbolUnscopablesExpression()),
        makeConditionalExpression(
          makeGetExpression(
            makeGetExpression(dynamic, makeSymbolUnscopablesExpression()),
            makeLiteralExpression(variable),
          ),
          makeLiteralExpression(false),
          makeBinaryExpression("in", makeLiteralExpression(variable), dynamic),
        ),
        makeBinaryExpression("in", makeLiteralExpression(variable), dynamic),
      ),
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

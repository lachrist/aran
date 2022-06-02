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

export const create = (_layer, {dynamic}) => dynamic;

export const harvest = constant_({prelude: [], header: []});

export const makeDeclareStatements = constant______(null);

export const makeInitializeStatements = constant_____(null);

const generateMakeLookupNode =
  (makeConditionalNode, makeDynamicLookupNode) =>
  (next, strict, _escaped, frame, variable, right) =>
    makeConditionalNode(
      makeConditionalExpression(
        makeGetExpression(frame, makeSymbolUnscopablesExpression()),
        makeConditionalExpression(
          makeGetExpression(
            makeGetExpression(frame, makeSymbolUnscopablesExpression()),
            makeLiteralExpression(variable),
          ),
          makeLiteralExpression(false),
          makeBinaryExpression("in", makeLiteralExpression(variable), frame),
        ),
        makeBinaryExpression("in", makeLiteralExpression(variable), frame),
      ),
      makeDynamicLookupNode(strict, frame, variable, right),
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

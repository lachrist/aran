import {
  constant_____,
  constant______,
  constant_,
} from "../../../util/index.mjs";

import {
  makeExpressionEffect,
  makeConditionalExpression,
  makeLiteralExpression,
  makeConditionalEffect,
} from "../../../ast/index.mjs";

import {
  makeGetExpression,
  makeBinaryExpression,
  makeSymbolUnscopablesExpression,
} from "../../../intrinsic.mjs";

import {isWrite} from "../right.mjs";

import {makeDynamicLookupExpression} from "./helper.mjs";

export const create = (_layer, {dynamic}) => dynamic;

export const harvest = constant_({prelude: [], header: []});

export const declare = constant______(null);

export const initialize = constant_____(null);

const makeTestExpression = (frame, variable) =>
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
  );

export const lookup = (next, frame, strict, _escaped, variable, right) => {
  const key = makeLiteralExpression(variable);
  if (isWrite(right)) {
    return makeConditionalEffect(
      makeTestExpression(frame, variable),
      makeExpressionEffect(
        makeDynamicLookupExpression(strict, frame, key, right),
      ),
      next(),
    );
  } else {
    return makeConditionalExpression(
      makeTestExpression(frame, variable),
      makeDynamicLookupExpression(strict, frame, key, right),
      next(),
    );
  }
};

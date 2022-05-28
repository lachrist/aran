import {includes} from "array-lite";

import {constant_, assert} from "../../../util/index.mjs";

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
  makeSetExpression,
  makeDataDescriptorExpression,
} from "../../../intrinsic.mjs";

import {isWrite} from "../right.mjs";

import {makeDynamicLookupExpression} from "./helper.mjs";

const kinds = ["var", "function"];

export const create = (_layer, {dynamic}) => dynamic;

export const harvest = constant_({prelude: [], header: []});

export const declare = (frame, _strict, kind, variable, iimport, eexports) => {
  if (includes(kinds, kind)) {
    assert(iimport === null, "unexpected global imported variable");
    assert(eexports.length === 0, "unexpected global exported variable");
    return [
      makeEffectStatement(
        makeExpressionEffect(
          makeConditionalExpression(
            makeBinaryExpression("in", makeLiteralExpression(variable), frame),
            makeLiteralExpression({undefined: null}),
            makeDefineExpression(
              frame,
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
  } else {
    return null;
  }
};

export const initialize = (frame, strict, kind, variable, expression) => {
  if (includes(kinds, kind)) {
    return [
      makeEffectStatement(
        makeExpressionEffect(
          makeSetExpression(
            strict,
            frame,
            makeLiteralExpression(variable),
            expression,
          ),
        ),
      ),
    ];
  } else {
    return null;
  }
};

export const lookup = (next, frame, strict, _escaped, variable, right) => {
  const key = makeLiteralExpression(variable);
  if (isWrite(right)) {
    return makeConditionalEffect(
      makeBinaryExpression("in", key, frame),
      makeExpressionEffect(
        makeDynamicLookupExpression(strict, frame, key, right),
      ),
      next(),
    );
  } else {
    return makeConditionalExpression(
      makeBinaryExpression("in", key, frame),
      makeDynamicLookupExpression(strict, frame, key, right),
      next(),
    );
  }
};

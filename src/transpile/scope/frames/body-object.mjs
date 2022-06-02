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

import {
  makeDynamicLookupExpression,
  makeDynamicLookupEffect,
} from "./helper.mjs";

const kinds = ["var", "function"];

export const create = (_layer, {dynamic}) => dynamic;

export const harvest = constant_({prelude: [], header: []});

export const makeDeclareStatements = (
  _strict,
  frame,
  kind,
  variable,
  iimport,
  eexports,
) => {
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

export const makeInitializeStatements = (
  strict,
  frame,
  kind,
  variable,
  expression,
) => {
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

export const makeLookupEffect = (
  next,
  strict,
  _escaped,
  frame,
  variable,
  right,
) =>
  makeConditionalEffect(
    makeBinaryExpression("in", makeLiteralExpression(variable), frame),
    makeDynamicLookupEffect(strict, frame, variable, right),
    next(),
  );

export const makeLookupExpression = (
  next,
  strict,
  _escaped,
  frame,
  variable,
  right,
) =>
  makeConditionalExpression(
    makeBinaryExpression("in", makeLiteralExpression(variable), frame),
    makeDynamicLookupExpression(strict, frame, variable, right),
    next(),
  );

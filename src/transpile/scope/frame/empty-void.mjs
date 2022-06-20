import {
  constant_,
  dropxxxx_x,
  deadcode______,
  deadcode_____,
  constant______,
} from "../../../util/index.mjs";

import {
  makeLiteralExpression,
  makeExpressionEffect,
} from "../../../ast/index.mjs";

import {makeThrowMissingExpression, makeDynamicWriteEffect} from "./helper.mjs";

const {undefined} = globalThis;

export const KINDS = [];

export const create = (_layer, {dynamic}) => ({dynamic});

export const conflict = constant_(undefined);

export const harvest = constant_({header: [], prelude: []});

export const declare = deadcode______("declaration on empty-void frame");

export const makeInitializeStatementArray = deadcode_____(
  "initialization on empty-void frame",
);

export const makeReadExpression = dropxxxx_x(makeThrowMissingExpression);

export const makeTypeofExpression = constant______(
  makeLiteralExpression("undefined"),
);

export const makeDiscardExpression = constant______(
  makeLiteralExpression(true),
);

export const makeWriteEffect = (
  _next,
  strict,
  escaped,
  frame,
  variable,
  options,
) => {
  if (strict) {
    return makeExpressionEffect(makeThrowMissingExpression(variable));
  } else {
    return makeDynamicWriteEffect(strict, escaped, frame, variable, options);
  }
};

import {
  constant_,
  bind______,
  deadcode______,
  deadcode_____,
} from "../../../util/index.mjs";

import {
  makeExpressionEffect,
  makeLiteralExpression,
} from "../../../ast/index.mjs";

import {makeSetExpression} from "../../../intrinsic.mjs";

import {makeThrowMissingExpression} from "./helper.mjs";

import {isRead, isDiscard, isTypeof, accessWrite} from "../right.mjs";

export const KINDS = [];

export const create = (_layer, {dynamic}) => ({dynamic});

export const harvest = constant_({header: [], prelude: []});

export const makeDeclareStatements = deadcode______(
  "declaration on root-miss frame",
);

export const makeInitializeStatements = deadcode_____(
  "initialization on root-miss frame",
);

export const makeLookupExpression = (
  _next,
  strict,
  _escaped,
  {dynamic},
  variable,
  right,
) => {
  if (isRead(right)) {
    return makeThrowMissingExpression(variable);
  } else if (isTypeof(right)) {
    return makeLiteralExpression("undefined");
  } else if (isDiscard(right)) {
    return makeLiteralExpression(true);
  } else {
    if (strict) {
      return makeThrowMissingExpression(variable);
    } else {
      return makeSetExpression(
        strict,
        dynamic,
        makeLiteralExpression(variable),
        accessWrite(right),
      );
    }
  }
};

export const makeLookupEffect = bind______(
  makeExpressionEffect,
  makeLookupExpression,
);

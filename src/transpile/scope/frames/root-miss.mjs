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

export const create = (_layer, {dynamic}) => dynamic;

export const harvest = constant_({header: [], prelude: []});

export const makeDeclareStatements = deadcode______("declare unsupported");

export const makeInitializeStatements = deadcode_____("initialize unsupported");

export const makeLookupExpression = (
  _next,
  strict,
  _escaped,
  frame,
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
        frame,
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

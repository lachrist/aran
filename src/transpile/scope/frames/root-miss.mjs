import {
  constant_,
  deadcode______,
  deadcode_____,
} from "../../../util/index.mjs";

import {
  makeExpressionEffect,
  makeLiteralExpression,
} from "../../../ast/index.mjs";

import {
  makeSetExpression,
  makeThrowReferenceErrorExpression,
} from "../../../intrinsic.mjs";

import {isRead, isDiscard, isTypeof, accessWrite} from "../right.mjs";

export const create = (_layer, {dynamic}) => dynamic;

export const harvest = constant_({header: [], prelude: []});

export const declare = deadcode______("declare unsupported");

export const initialize = deadcode_____("initialize unsupported");

export const lookup = (_next, frame, strict, _escaped, variable, right) => {
  if (isTypeof(right)) {
    return makeLiteralExpression("undefined");
  } else if (isDiscard(right)) {
    return makeLiteralExpression(true);
  } else if (isRead(right)) {
    return makeThrowReferenceErrorExpression(`${variable} is not defined`);
  } else {
    if (strict) {
      return makeExpressionEffect(
        makeThrowReferenceErrorExpression(`${variable} is not defined`),
      );
    } else {
      return makeExpressionEffect(
        makeSetExpression(
          strict,
          frame,
          makeLiteralExpression(variable),
          accessWrite(right),
        ),
      );
    }
  }
};

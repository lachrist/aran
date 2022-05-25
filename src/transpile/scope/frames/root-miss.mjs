import {
  returnx,
  constant_,
  constant_____,
  constant____,
} from "../../../util/index.mjs";

import {
  makeExpressionEffect,
  makeLiteralExpression,
} from "../../../ast/index.mjs";

import {
  makeSetExpression,
  makeThrowReferenceErrorExpression,
} from "../../../intrinsic.mjs";

import {isRead, isDelete, isTypeof, accessWrite} from "../right.mjs";

export const create = returnx;

export const harvest = constant_({header: [], prelude: []});

export const declare = constant_____(null);

export const initialize = constant____(null);

export const lookup = (_next, frame, _escaped, strict, variable, right) => {
  if (isTypeof(right)) {
    return makeLiteralExpression("undefined");
  } else if (isDelete(right)) {
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

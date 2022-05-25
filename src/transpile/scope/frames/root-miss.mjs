import {constant_, constant_____, constant____} from "../../../util/index.mjs";

import {
  makeExpressionEffect,
  makeLiteralExpression,
} from "../../../ast/index.mjs";

import {
  makeSetExpression,
  makeThrowReferenceErrorExpression,
} from "../../../intrinsic.mjs";

import {
  isRead as isReadRight,
  isDelete as isDeleteRight,
  isTypeof as isTypeofRight,
  accessWrite as accessRightWrite,
} from "../right.mjs";

export {returnx as create} from "../../../util/index.mjs";

export const harvest = constant_({header: [], prelude: []});

export const declare = constant_____(null);

export const initialize = constant____(null);

export const lookup = (_next, frame, _escaped, strict, variable, right) => {
  if (isTypeofRight(right)) {
    return makeLiteralExpression("undefined");
  } else if (isDeleteRight(right)) {
    return makeLiteralExpression(true);
  } else if (isReadRight(right)) {
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
          accessRightWrite(right),
        ),
      );
    }
  }
};

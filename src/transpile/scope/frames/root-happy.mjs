import {returnx, assert, constant_} from "../../../util/index.mjs";

import {
  makeEffectStatement,
  makeLiteralExpression,
  makeExpressionEffect,
} from "../../../ast/index.mjs";

import {
  makeGetExpression,
  makeUnaryExpression,
  makeSetStrictExpression,
} from "../../../intrinsic.mjs";

import {isRead, isTypeof, isDelete, accessWrite} from "../right.mjs";

export const create = returnx;

export const harvest = constant_({prelude: [], header: []});

export const declare = (_frame, _kind, _variable, iimport, eexports) => {
  assert(iimport === null, "unexpected imported declaration");
  assert(eexports.length === 0, "unexpected exported declaration");
  return [];
};

export const initialize = (frame, _kind, variable, expression) => [
  makeEffectStatement(
    makeExpressionEffect(
      makeSetStrictExpression(
        frame,
        makeLiteralExpression(variable),
        expression,
      ),
    ),
  ),
];

export const lookup = (_next, frame, _strict, _escaped, variable, right) => {
  if (isRead(right)) {
    return makeGetExpression(frame, makeLiteralExpression(variable));
  } else if (isTypeof(right)) {
    return makeUnaryExpression(
      "typeof",
      makeGetExpression(frame, makeLiteralExpression(variable)),
    );
  } else if (isDelete(right)) {
    return makeLiteralExpression(false);
  } else {
    return makeExpressionEffect(
      makeSetStrictExpression(
        frame,
        makeLiteralExpression(variable),
        accessWrite(right),
      ),
    );
  }
};

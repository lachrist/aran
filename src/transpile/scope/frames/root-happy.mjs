
import {
  isMetaVariable,
  getVariableBody,
} from "../variable.mjs";

import {
  isReadRight,
  isTypeofRight,
  isDeleteRight,
  getRightExpression,
} from "../right.mjs";

export {create as identity} from "../../util.mjs";

export const harvest = constant_({prelude:[], header:[]});

export const declare = (_frame, kind, variable, import_, exports_) => {
  assert(import_ === null, "unexpected imported declaration");
  assert(exports_.length === 0, "unexpected exported declaration");
  return [];
};

export const initialize = (frame, kind, variable, expression) => makeExpressionEffect(
  makeStrictSetExpression(
    makeIntrinsicExpression(frame),
    makeLiteralExpression(variable),
    expression,
  ),
);

export const lookup = (next, frame, _escaped, _strict, variable, right) => {
  if (isReadRight(right)) {
    return makeGetExpression(
      makeIntrinsicExpression(frame),
      makeLiteralExpression(variable),
    );
  } else if (isTypeofRight(right)) {
    return makeUnaryExpression(
      "typeof",
      makeGetExpression(
        makeIntrinsicExpression(frame),
        makeLiteralExpression(variable),
      ),
    );
  } else if (isDeleteRight(right)) {
    return makeLiteralExpression(false);
  } else {
    return makeExpressionEffect(
      makeSetStrictExpression(
        makeIntrinsicExpression(frame),
        makeLiteralExpression(variable),
        getRightExpression(right),
      )
    );
  }
};

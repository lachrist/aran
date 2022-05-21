
import {constant} from "../util.mjs";

export {identity as create} from "../util.mjs";

export const harvest = constant_({header:[], prelude:[]);

export const declare = constant_____(null);

export const initialize = constant____(null);

export const lookup = (_next, frame, _escaped, strict, variable, right) => {
  if (isTypeofRight(right)) {
    return makeLiteralExpression("undefined"),
  } else if (isDeleteRight(right)) {
    return makeLiteralExpression(true);
  } else if (isReadRight(right)) {
    return makeThrowReferenceError(`${variable} is not defined`);
  } else {
    if (strict) {
      return makeExpressionEffect(
        makeThrowReferenceError(`${variable} is not defined`),
      );
    } else {
      return makeSetExpression(
        strict,
        makeIntrinsicExpression(frame),
        makeLiteralExpression(),
        getRightExpression(right),
      );
    }
  }
};

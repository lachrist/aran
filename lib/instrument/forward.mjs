import {
  makeApplyExpression,
  makeConstructExpression,
  makePrimitiveExpression,
  packPrimitive,
} from "../syntax.mjs";

import { hasOwn } from "../util/object.mjs";

/** @type {(point: Point) => Expression} */
export const makeForwardExpression = (point) => {
  if (point.type === "apply") {
    return makeApplyExpression(point.callee, point.this, point.arguments);
  } else if (point.type === "construct") {
    return makeConstructExpression(point.callee, point.arguments);
  } else if (point.type === "primitive.after") {
    return makePrimitiveExpression(packPrimitive(point.value));
  } else if (hasOwn(point, "value")) {
    return point.value;
  } else {
    return makePrimitiveExpression({ undefined: null });
  }
};

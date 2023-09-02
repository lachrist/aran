import { packPrimitive } from "../deconstruct/syntax.mjs";

import {
  makeApplyExpression,
  makeConstructExpression,
  makePrimitiveExpression,
} from "./syntax.mjs";

import { hasOwn } from "../util/object.mjs";

/**
 * @template X
 * @typedef {Record<string, X>} Scope<X>
 */

/** @type {<S, L, V>(point: Point<S, L, V>) => Expression<Usage>} */
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

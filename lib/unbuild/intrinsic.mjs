import { concat_XXXX } from "../util/index.mjs";
import {
  makeApplyExpression,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeConstructExpression,
} from "./node.mjs";

/**
 * @type {(
 *   elements: import("./atom").Expression[],
 *   tag: import("../hash").Hash,
 * ) => import("./atom").Expression}
 */
export const makeArrayExpression = (elements, tag) =>
  makeApplyExpression(
    makeIntrinsicExpression("Array.of", tag),
    makeIntrinsicExpression("undefined", tag),
    elements,
    tag,
  );

/**
 * @type {(
 *   operator: import("estree-sentry").UnaryOperator,
 *   argument: import("./atom").Expression,
 *   tag: import("../hash").Hash,
 * ) => import("./atom").Expression}
 */
export const makeUnaryExpression = (operator, argument, tag) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.unary", tag),
    makeIntrinsicExpression("undefined", tag),
    [makePrimitiveExpression(operator, tag), argument],
    tag,
  );

/**
 * @type {(
 *   operator: import("estree-sentry").BinaryOperator,
 *   left: import("./atom").Expression,
 *   right: import("./atom").Expression,
 *   tag: import("../hash").Hash,
 * ) => import("./atom").Expression}
 */
export const makeBinaryExpression = (operator, left, right, tag) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.binary", tag),
    makeIntrinsicExpression("undefined", tag),
    [makePrimitiveExpression(operator, tag), left, right],
    tag,
  );

/**
 * @type {(
 *   object: import("./atom").Expression,
 *   key: import("./atom").Expression,
 *   tag: import("../hash").Hash,
 * ) => import("./atom").Expression}
 */
export const makeGetExpression = (object, key, tag) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.get", tag),
    makeIntrinsicExpression("undefined", tag),
    [object, key],
    tag,
  );

/**
 * @type {(
 *   error: import("./atom").Expression,
 *   tag: import("../hash").Hash,
 * ) => import("./atom").Expression}
 */
export const makeThrowExpression = (error, tag) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.throw", tag),
    makeIntrinsicExpression("undefined", tag),
    [error],
    tag,
  );

/**
 * @type {(
 *   intrinsic: import("../lang").Intrinsic,
 *   message: string,
 *   tag: import("../hash").Hash,
 * ) => import("./atom").Expression}
 */
export const makeThrowErrorExpression = (intrinsic, message, tag) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.throw", tag),
    makeIntrinsicExpression("undefined", tag),
    [
      makeConstructExpression(
        makeIntrinsicExpression(intrinsic, tag),
        [makePrimitiveExpression(message, tag)],
        tag,
      ),
    ],
    tag,
  );

/**
 * @type {(
 *   key: string,
 *   value: null | boolean | import("./atom").Expression,
 *   tag: import("../hash").Hash,
 * ) => import("./atom").Expression[]}
 */
const makeDescriptorProperty = (key, value, tag) =>
  value === null
    ? []
    : [
        makePrimitiveExpression(key, tag),
        typeof value === "boolean"
          ? makePrimitiveExpression(value, tag)
          : value,
      ];

/**
 * @type {<X1, X2, X3, X4>(
 *   value: X1,
 *   writable: X2,
 *   enumerable: X3,
 *   configurable: X4,
 * ) => {
 *   value: X1,
 *   writable: X2,
 *   enumerable: X3,
 *   configurable: X4,
 * }}
 */
export const makeDataDescriptor = (
  value,
  writable,
  enumerable,
  configurable,
) => ({
  value,
  writable,
  enumerable,
  configurable,
});

/**
 * @type {(
 *   descriptor: {
 *     value: null | import("./atom").Expression,
 *     writable: null | boolean | import("./atom").Expression,
 *     enumerable: null | boolean | import("./atom").Expression,
 *     configurable: null | boolean | import("./atom").Expression,
 *   },
 *   tag: import("../hash").Hash,
 * ) => import("./atom").Expression}
 */
export const makeDataDescriptorExpression = (
  { value, writable, enumerable, configurable },
  tag,
) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.createObject", tag),
    makeIntrinsicExpression("undefined", tag),
    concat_XXXX(
      makePrimitiveExpression(null, tag),
      makeDescriptorProperty("value", value, tag),
      makeDescriptorProperty("writable", writable, tag),
      makeDescriptorProperty("enumerable", enumerable, tag),
      makeDescriptorProperty("configurable", configurable, tag),
    ),
    tag,
  );

/**
 * @type {<X1, X2, X3, X4>(
 *   get: X1,
 *   set: X2,
 *   enumerable: X3,
 *   configurable: X4,
 * ) => {
 *   get: X1,
 *   set: X2,
 *   enumerable: X3,
 *   configurable: X4,
 * }}
 */
export const makeAccessorDescriptor = (get, set, enumerable, configurable) => ({
  get,
  set,
  enumerable,
  configurable,
});

/**
 * @type {(
 *   descriptor: {
 *     get: null | import("./atom").Expression,
 *     set: null | import("./atom").Expression,
 *     enumerable: null | boolean | import("./atom").Expression,
 *     configurable: null | boolean | import("./atom").Expression,
 *   },
 *   tag: import("../hash").Hash,
 * ) => import("./atom").Expression}
 */
export const makeAccessorDescriptorExpression = (
  { get, set, enumerable, configurable },
  tag,
) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.createObject", tag),
    makeIntrinsicExpression("undefined", tag),
    concat_XXXX(
      makePrimitiveExpression(null, tag),
      makeDescriptorProperty("get", get, tag),
      makeDescriptorProperty("set", set, tag),
      makeDescriptorProperty("enumerable", enumerable, tag),
      makeDescriptorProperty("configurable", configurable, tag),
    ),
    tag,
  );

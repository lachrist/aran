import { concat_XXXX } from "../util/index.mjs";
import {
  makeApplyExpression,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeConstructExpression,
} from "./node.mjs";

/**
 * @type {(
 *   elements: aran.Expression<unbuild.Atom>[],
 *   tag: import("./path").Path,
 * ) => aran.Expression<unbuild.Atom>}
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
 *   operator: estree.UnaryOperator,
 *   argument: aran.Expression<unbuild.Atom>,
 *   tag: import("./path").Path,
 * ) => aran.Expression<unbuild.Atom>}
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
 *   operator: estree.BinaryOperator,
 *   left: aran.Expression<unbuild.Atom>,
 *   right: aran.Expression<unbuild.Atom>,
 *   tag: import("./path").Path,
 * ) => aran.Expression<unbuild.Atom>}
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
 *   object: aran.Expression<unbuild.Atom>,
 *   key: aran.Expression<unbuild.Atom>,
 *   tag: import("./path").Path,
 * ) => aran.Expression<unbuild.Atom>}
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
 *   error: aran.Expression<unbuild.Atom>,
 *   tag: import("./path").Path,
 * ) => aran.Expression<unbuild.Atom>}
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
 *   intrinsic: aran.Intrinsic,
 *   message: string,
 *   tag: import("./path").Path,
 * ) => aran.Expression<unbuild.Atom>}
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
 *   value: null | boolean | aran.Expression<unbuild.Atom>,
 *   tag: import("./path").Path,
 * ) => aran.Expression<unbuild.Atom>[]}
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
 *     value: null | aran.Expression<unbuild.Atom>,
 *     writable: null | boolean | aran.Expression<unbuild.Atom>,
 *     enumerable: null | boolean | aran.Expression<unbuild.Atom>,
 *     configurable: null | boolean | aran.Expression<unbuild.Atom>,
 *   },
 *   tag: import("./path").Path,
 * ) => aran.Expression<unbuild.Atom>}
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
 *     get: null | aran.Expression<unbuild.Atom>,
 *     set: null | aran.Expression<unbuild.Atom>,
 *     enumerable: null | boolean | aran.Expression<unbuild.Atom>,
 *     configurable: null | boolean | aran.Expression<unbuild.Atom>,
 *   },
 *   tag: import("./path").Path,
 * ) => aran.Expression<unbuild.Atom>}
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

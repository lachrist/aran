import { flat, reduceReverse } from "../util/index.mjs";

import {
  makeApplyExpression,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeConstructExpression,
  makeSequenceExpression,
} from "./node.mjs";

/**
 * @type {(
 *   elements: aran.Expression<unbuild.Atom>[],
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeArrayExpression = (elements, path) =>
  makeApplyExpression(
    makeIntrinsicExpression("Array.of", path),
    makePrimitiveExpression({ undefined: null }, path),
    elements,
    path,
  );

/**
 * @type {(
 *   operator: estree.UnaryOperator,
 *   argument: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeUnaryExpression = (operator, argument, path) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.unary", path),
    makePrimitiveExpression({ undefined: null }, path),
    [makePrimitiveExpression(operator, path), argument],
    path,
  );

/**
 * @type {(
 *   operator: estree.BinaryOperator,
 *   left: aran.Expression<unbuild.Atom>,
 *   right: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeBinaryExpression = (operator, left, right, path) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.binary", path),
    makePrimitiveExpression({ undefined: null }, path),
    [makePrimitiveExpression(operator, path), left, right],
    path,
  );

/**
 * @type {(
 *   prototype: aran.Expression<unbuild.Atom>,
 *   properties: [
 *     aran.Expression<unbuild.Atom>,
 *     aran.Expression<unbuild.Atom>,
 *   ][],
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeObjectExpression = (prototype, properties, path) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.createObject", path),
    makePrimitiveExpression({ undefined: null }, path),
    [prototype, ...flat(properties)],
    path,
  );

/**
 * @type {(
 *   object: aran.Expression<unbuild.Atom>,
 *   key: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeGetExpression = (object, key, path) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.get", path),
    makePrimitiveExpression({ undefined: null }, path),
    [object, key],
    path,
  );

/**
 * @type {(
 *   strict: boolean,
 *   object: aran.Expression<unbuild.Atom>,
 *   key: aran.Expression<unbuild.Atom>,
 *   value: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeSetExpression = (strict, object, key, value, path) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.set", path),
    makePrimitiveExpression({ undefined: null }, path),
    [makePrimitiveExpression(strict, path), object, key, value],
    path,
  );

/**
 * @type {(
 *   strict: boolean,
 *   object: aran.Expression<unbuild.Atom>,
 *   key: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeDeleteExpression = (strict, object, key, path) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.delete", path),
    makePrimitiveExpression({ undefined: null }, path),
    [makePrimitiveExpression(strict, path), object, key],
    path,
  );

/**
 * @type {(
 *   error: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeThrowExpression = (error, path) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.throw", path),
    makePrimitiveExpression({ undefined: null }, path),
    [error],
    path,
  );

/**
 * @type {(
 *   intrinsic: aran.Intrinsic,
 *   message: string,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeThrowErrorExpression = (intrinsic, message, path) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.throw", path),
    makePrimitiveExpression({ undefined: null }, path),
    [
      makeConstructExpression(
        makeIntrinsicExpression(intrinsic, path),
        [makePrimitiveExpression(message, path)],
        path,
      ),
    ],
    path,
  );

/**
 * @type {(
 *   key: string,
 *   value: aran.Expression<unbuild.Atom> | null | boolean,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>[]}
 */
const makeDescriptorProperty = (key, value, path) =>
  value === null
    ? []
    : [
        makePrimitiveExpression(key, path),
        typeof value === "boolean"
          ? makePrimitiveExpression(value, path)
          : value,
      ];

/**
 * @type {(
 *   descriptor: {
 *     value: aran.Expression<unbuild.Atom> | null,
 *     writable: aran.Expression<unbuild.Atom> | null | boolean,
 *     enumerable: aran.Expression<unbuild.Atom> | null | boolean,
 *     configurable: aran.Expression<unbuild.Atom>  | null | boolean,
 *   },
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeDataDescriptorExpression = (
  { value, writable, enumerable, configurable },
  path,
) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.createObject", path),
    makePrimitiveExpression({ undefined: null }, path),
    [
      makePrimitiveExpression(null, path),
      ...makeDescriptorProperty("value", value, path),
      ...makeDescriptorProperty("writable", writable, path),
      ...makeDescriptorProperty("enumerable", enumerable, path),
      ...makeDescriptorProperty("configurable", configurable, path),
    ],
    path,
  );

/**
 * @type {(
 *   descriptor: {
 *     get: aran.Expression<unbuild.Atom> | null,
 *     set: aran.Expression<unbuild.Atom> | null,
 *     enumerable: aran.Expression<unbuild.Atom> | null | boolean,
 *     configurable: aran.Expression<unbuild.Atom> | null | boolean,
 *   },
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeAccessorDescriptorExpression = (
  { get, set, enumerable, configurable },
  path,
) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.createObject", path),
    makePrimitiveExpression({ undefined: null }, path),
    [
      makePrimitiveExpression(null, path),
      ...makeDescriptorProperty("get", get, path),
      ...makeDescriptorProperty("set", set, path),
      ...makeDescriptorProperty("enumerable", enumerable, path),
      ...makeDescriptorProperty("configurable", configurable, path),
    ],
    path,
  );

/**
 * @type {(
 *   effects: aran.Effect<unbuild.Atom>[],
 *   expression: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeLongSequenceExpression = (effects, expression, path) =>
  reduceReverse(
    effects,
    (sequence, effect) => makeSequenceExpression(effect, sequence, path),
    expression,
  );

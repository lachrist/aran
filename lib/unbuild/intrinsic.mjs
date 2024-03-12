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
    makePrimitiveExpression({ undefined: null }, tag),
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
    makePrimitiveExpression({ undefined: null }, tag),
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
    makePrimitiveExpression({ undefined: null }, tag),
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
    makePrimitiveExpression({ undefined: null }, tag),
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
    makePrimitiveExpression({ undefined: null }, tag),
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
    makePrimitiveExpression({ undefined: null }, tag),
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
        makeArrayExpression(
          [
            makePrimitiveExpression(key, tag),
            typeof value === "boolean"
              ? makePrimitiveExpression(value, tag)
              : value,
          ],
          tag,
        ),
      ];

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
    makeIntrinsicExpression("Object.setPrototypeOf", tag),
    makePrimitiveExpression({ undefined: null }, tag),
    [
      makeApplyExpression(
        makeIntrinsicExpression("Object.fromEntries", tag),
        makePrimitiveExpression({ undefined: null }, tag),
        [
          makeArrayExpression(
            [
              ...makeDescriptorProperty("value", value, tag),
              ...makeDescriptorProperty("writable", writable, tag),
              ...makeDescriptorProperty("enumerable", enumerable, tag),
              ...makeDescriptorProperty("configurable", configurable, tag),
            ],
            tag,
          ),
        ],
        tag,
      ),
      makePrimitiveExpression(null, tag),
    ],
    tag,
  );

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
    makeIntrinsicExpression("Object.setPrototypeOf", tag),
    makePrimitiveExpression({ undefined: null }, tag),
    [
      makeApplyExpression(
        makeIntrinsicExpression("Object.fromEntries", tag),
        makePrimitiveExpression({ undefined: null }, tag),
        [
          makeArrayExpression(
            [
              ...makeDescriptorProperty("get", get, tag),
              ...makeDescriptorProperty("set", set, tag),
              ...makeDescriptorProperty("enumerable", enumerable, tag),
              ...makeDescriptorProperty("configurable", configurable, tag),
            ],
            tag,
          ),
        ],
        tag,
      ),
      makePrimitiveExpression(null, tag),
    ],
    tag,
  );

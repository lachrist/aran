import {
  makeApplyExpression,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeConstructExpression,
} from "./node.mjs";

/**
 * @type {(
 *   elements: import("./sequence").ExpressionSequence[],
 *   path: unbuild.Path,
 * ) => import("./sequence").ExpressionSequence}
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
 *   argument: import("./sequence").ExpressionSequence,
 *   path: unbuild.Path,
 * ) => import("./sequence").ExpressionSequence}
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
 *   left: import("./sequence").ExpressionSequence,
 *   right: import("./sequence").ExpressionSequence,
 *   path: unbuild.Path,
 * ) => import("./sequence").ExpressionSequence}
 */
export const makeBinaryExpression = (operator, left, right, path) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.binary", path),
    makePrimitiveExpression({ undefined: null }, path),
    [makePrimitiveExpression(operator, path), left, right],
    path,
  );

// /**
//  * @type {(
//  *   prototype: import("./sequence").ExpressionSequence,
//  *   properties: [
//  *     import("./sequence").ExpressionSequence,
//  *     import("./sequence").ExpressionSequence,
//  *   ][],
//  *   path: unbuild.Path,
//  * ) => import("./sequence").ExpressionSequence}
//  */
// export const makeObjectExpression = (prototype, properties, path) =>
//   makeApplyExpression(
//     makeIntrinsicExpression("aran.createObject", path),
//     makePrimitiveExpression({ undefined: null }, path),
//     [prototype, ...flat(properties)],
//     path,
//   );

/**
 * @type {(
 *   object: import("./sequence").ExpressionSequence,
 *   key: import("./sequence").ExpressionSequence,
 *   path: unbuild.Path,
 * ) => import("./sequence").ExpressionSequence}
 */
export const makeGetExpression = (object, key, path) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.get", path),
    makePrimitiveExpression({ undefined: null }, path),
    [object, key],
    path,
  );

// /**
//  * @type {(
//  *   mode: "strict" | "sloppy",
//  *   object: import("./sequence").ExpressionSequence,
//  *   key: import("./sequence").ExpressionSequence,
//  *   value: import("./sequence").ExpressionSequence,
//  *   path: unbuild.Path,
//  * ) => import("./sequence").ExpressionSequence}
//  */
// export const makeSetExpression = (mode, object, key, value, path) =>
//   makeApplyExpression(
//     makeIntrinsicExpression(`aran.set.${mode}`, path),
//     makePrimitiveExpression({ undefined: null }, path),
//     [object, key, value],
//     path,
//   );

// /**
//  * @type {(
//  *   mode: "strict" | "sloppy",
//  *   object: import("./sequence").ExpressionSequence,
//  *   key: import("./sequence").ExpressionSequence,
//  *   path: unbuild.Path,
//  * ) => import("./sequence").ExpressionSequence}
//  */
// export const makeDeleteExpression = (mode, object, key, path) =>
//   makeApplyExpression(
//     makeIntrinsicExpression(`aran.delete.${mode}`, path),
//     makePrimitiveExpression({ undefined: null }, path),
//     [object, key],
//     path,
//   );

/**
 * @type {(
 *   error: import("./sequence").ExpressionSequence,
 *   path: unbuild.Path,
 * ) => import("./sequence").ExpressionSequence}
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
 * ) => import("./sequence").ExpressionSequence}
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
 *   value: import("./sequence").ExpressionSequence | null | boolean,
 *   path: unbuild.Path,
 * ) => import("./sequence").ExpressionSequence[]}
 */
const makeDescriptorProperty = (key, value, path) =>
  value === null
    ? []
    : [
        makeArrayExpression(
          [
            makePrimitiveExpression(key, path),
            typeof value === "boolean"
              ? makePrimitiveExpression(value, path)
              : value,
          ],
          path,
        ),
      ];

/**
 * @type {(
 *   descriptor: {
 *     value: import("./sequence").ExpressionSequence | null,
 *     writable: import("./sequence").ExpressionSequence | null | boolean,
 *     enumerable: import("./sequence").ExpressionSequence | null | boolean,
 *     configurable: import("./sequence").ExpressionSequence  | null | boolean,
 *   },
 *   path: unbuild.Path,
 * ) => import("./sequence").ExpressionSequence}
 */
export const makeDataDescriptorExpression = (
  { value, writable, enumerable, configurable },
  path,
) =>
  makeApplyExpression(
    makeIntrinsicExpression("Object.setPrototypeOf", path),
    makePrimitiveExpression({ undefined: null }, path),
    [
      makeApplyExpression(
        makeIntrinsicExpression("Object.fromEntries", path),
        makePrimitiveExpression({ undefined: null }, path),
        [
          makeArrayExpression(
            [
              ...makeDescriptorProperty("value", value, path),
              ...makeDescriptorProperty("writable", writable, path),
              ...makeDescriptorProperty("enumerable", enumerable, path),
              ...makeDescriptorProperty("configurable", configurable, path),
            ],
            path,
          ),
        ],
        path,
      ),
      makePrimitiveExpression(null, path),
    ],
    path,
  );

/**
 * @type {(
 *   descriptor: {
 *     get: import("./sequence").ExpressionSequence | null,
 *     set: import("./sequence").ExpressionSequence | null,
 *     enumerable: import("./sequence").ExpressionSequence | null | boolean,
 *     configurable: import("./sequence").ExpressionSequence | null | boolean,
 *   },
 *   path: unbuild.Path,
 * ) => import("./sequence").ExpressionSequence}
 */
export const makeAccessorDescriptorExpression = (
  { get, set, enumerable, configurable },
  path,
) =>
  makeApplyExpression(
    makeIntrinsicExpression("Object.setPrototypeOf", path),
    makePrimitiveExpression({ undefined: null }, path),
    [
      makeApplyExpression(
        makeIntrinsicExpression("Object.fromEntries", path),
        makePrimitiveExpression({ undefined: null }, path),
        [
          makeArrayExpression(
            [
              ...makeDescriptorProperty("get", get, path),
              ...makeDescriptorProperty("set", set, path),
              ...makeDescriptorProperty("enumerable", enumerable, path),
              ...makeDescriptorProperty("configurable", configurable, path),
            ],
            path,
          ),
        ],
        path,
      ),
      makePrimitiveExpression(null, path),
    ],
    path,
  );

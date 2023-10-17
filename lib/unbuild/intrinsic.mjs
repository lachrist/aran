import { AranTypeError, flat, map, reduceReverse } from "../util/index.mjs";

import {
  makeApplyExpression,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeConstructExpression,
  makeSequenceExpression,
} from "./node.mjs";

const {
  Object: { entries: listEntry },
  Array: { isArray },
} = globalThis;

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
 *   value: aran.Expression<unbuild.Atom> | null,
 *   writable: aran.Expression<unbuild.Atom> | null,
 *   enumerable: aran.Expression<unbuild.Atom> | null,
 *   configurable: aran.Expression<unbuild.Atom> | null,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeDataDescriptorExpression = (
  value,
  writable,
  enumerable,
  configurable,
  path,
) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.createObject", path),
    makePrimitiveExpression({ undefined: null }, path),
    [
      makePrimitiveExpression(null, path),
      ...(value === null
        ? []
        : [makePrimitiveExpression("value", path), value]),
      ...(writable === null
        ? []
        : [makePrimitiveExpression("writable", path), writable]),
      ...(enumerable === null
        ? []
        : [makePrimitiveExpression("enumerable", path), enumerable]),
      ...(configurable === null
        ? []
        : [makePrimitiveExpression("configurable", path), configurable]),
    ],
    path,
  );

/**
 * @type {(
 *   get: aran.Expression<unbuild.Atom> | null,
 *   set: aran.Expression<unbuild.Atom> | null,
 *   enumerable: aran.Expression<unbuild.Atom> | null,
 *   configurable: aran.Expression<unbuild.Atom> | null,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeAccessorDescriptorExpression = (
  get,
  set,
  enumerable,
  configurable,
  path,
) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.createObject", path),
    makePrimitiveExpression({ undefined: null }, path),
    flat([
      [makePrimitiveExpression(null, path)],
      get === null ? [] : [makePrimitiveExpression("get", path), get],
      set === null ? [] : [makePrimitiveExpression("set", path), set],
      enumerable === null
        ? []
        : [makePrimitiveExpression("enumerable", path), enumerable],
      configurable === null
        ? []
        : [makePrimitiveExpression("configurable", path), configurable],
    ]),
    path,
  );

/**
 * @type {(
 *   entry: [string, Json],
 *   path: unbuild.Path,
 * ) => [aran.Expression<unbuild.Atom>, aran.Expression<unbuild.Atom>]}
 */
const makeJsonEntry = ([key, val], path) => [
  makePrimitiveExpression(key, path),
  // eslint-disable-next-line no-use-before-define
  makeJsonExpression(val, path),
];

/**
 * @type {(
 *   json: Json,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeJsonExpression = (json, path) => {
  if (
    json === null ||
    typeof json === "boolean" ||
    typeof json === "number" ||
    typeof json === "string"
  ) {
    return makePrimitiveExpression(json, path);
  } else if (isArray(json)) {
    return makeArrayExpression(
      map(json, (item) => makeJsonExpression(item, path)),
      path,
    );
  } else if (typeof json === "object") {
    return makeObjectExpression(
      makeIntrinsicExpression("Object.prototype", path),
      map(listEntry(json), (entry) => makeJsonEntry(entry, path)),
      path,
    );
  } /* c8 ignore start */ else {
    throw new AranTypeError("invalid json", json);
  } /* c8 ignore stop */
};

// /**
//  * @type {(
//  *   property: [string, unknown],
//  *   path: unbuild.Path,
//  * ) => [aran.Expression<unbuild.Atom>, aran.Expression<unbuild.Atom>]}
//  */
// const makeDataProperty = ({ 0: key, 1: value }, path) => [
//   makePrimitiveExpression(key, path),
//   // eslint-disable-next-line no-use-before-define
//   makeDataExpression(value, path),
// ];

// /**
//  * @type {(
//  *   data: unknown,
//  *   path: unbuild.Path,
//  * ) => aran.Expression<unbuild.Atom>}
//  */
// export const makeDataExpression = (data, path) => {
//   if (typeof data === "object" && data !== null) {
//     if (isArray(data)) {
//       return makeArrayExpression(
//         map(data, (item) => makeDataExpression(item, path)),
//         path,
//       );
//     } else {
//       return makeObjectExpression(
//         makePrimitiveExpression(null, path),
//         map(listEntry(data), (entry) => makeDataProperty(entry, path)),
//         path,
//       );
//     }
//   } else if (
//     data === undefined ||
//     data === null ||
//     typeof data === "boolean" ||
//     typeof data === "number" ||
//     typeof data === "bigint" ||
//     typeof data === "string"
//   ) {
//     return makePrimitiveExpression(packPrimitive(data), path);
//   } else {
//     throw new DynamicError("cannot serialize", data);
//   }
// };

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

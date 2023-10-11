import {
  DynamicError,
  StaticError,
  flat,
  map,
  reduceReverse,
} from "../util/index.mjs";

import { packPrimitive } from "../lang.mjs";

import {
  makeApplyExpression,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeConstructExpression,
  makeSequenceExpression,
} from "./node.mjs";

const {
  undefined,
  Object: { entries: listEntry },
  Array: { isArray },
} = globalThis;

/**
 * @type {(
 *   elements: aran.Expression<unbuild.Atom>[],
 *   origin: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeArrayExpression = (elements, origin) =>
  makeApplyExpression(
    makeIntrinsicExpression("Array.of", origin),
    makePrimitiveExpression({ undefined: null }, origin),
    elements,
    origin,
  );

/**
 * @type {(
 *   operator: estree.UnaryOperator,
 *   argument: aran.Expression<unbuild.Atom>,
 *   origin: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeUnaryExpression = (operator, argument, origin) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.unary", origin),
    makePrimitiveExpression({ undefined: null }, origin),
    [makePrimitiveExpression(operator, origin), argument],
    origin,
  );

/**
 * @type {(
 *   operator: estree.BinaryOperator,
 *   left: aran.Expression<unbuild.Atom>,
 *   right: aran.Expression<unbuild.Atom>,
 *   origin: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeBinaryExpression = (operator, left, right, origin) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.binary", origin),
    makePrimitiveExpression({ undefined: null }, origin),
    [makePrimitiveExpression(operator, origin), left, right],
    origin,
  );

/**
 * @type {(
 *   prototype: aran.Expression<unbuild.Atom>,
 *   properties: [
 *     aran.Expression<unbuild.Atom>,
 *     aran.Expression<unbuild.Atom>,
 *   ][],
 *   origin: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeObjectExpression = (prototype, properties, origin) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.createObject", origin),
    makePrimitiveExpression({ undefined: null }, origin),
    [prototype, ...flat(properties)],
    origin,
  );

/**
 * @type {(
 *   object: aran.Expression<unbuild.Atom>,
 *   key: aran.Expression<unbuild.Atom>,
 *   origin: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeGetExpression = (object, key, origin) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.get", origin),
    makePrimitiveExpression({ undefined: null }, origin),
    [object, key],
    origin,
  );

/**
 * @type {(
 *   strict: boolean,
 *   object: aran.Expression<unbuild.Atom>,
 *   key: aran.Expression<unbuild.Atom>,
 *   value: aran.Expression<unbuild.Atom>,
 *   origin: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeSetExpression = (strict, object, key, value, origin) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.set", origin),
    makePrimitiveExpression({ undefined: null }, origin),
    [makePrimitiveExpression(strict, origin), object, key, value],
    origin,
  );

/**
 * @type {(
 *   strict: boolean,
 *   object: aran.Expression<unbuild.Atom>,
 *   key: aran.Expression<unbuild.Atom>,
 *   origin: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeDeleteExpression = (strict, object, key, origin) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.delete", origin),
    makePrimitiveExpression({ undefined: null }, origin),
    [makePrimitiveExpression(strict, origin), object, key],
    origin,
  );

/**
 * @type {(
 *   error: aran.Expression<unbuild.Atom>,
 *   origin: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeThrowExpression = (error, origin) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.throw", origin),
    makePrimitiveExpression({ undefined: null }, origin),
    [error],
    origin,
  );

/**
 * @type {(
 *   intrinsic: aran.Intrinsic,
 *   message: string,
 *   origin: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeThrowErrorExpression = (intrinsic, message, origin) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.throw", origin),
    makePrimitiveExpression({ undefined: null }, origin),
    [
      makeConstructExpression(
        makeIntrinsicExpression(intrinsic, origin),
        [makePrimitiveExpression(message, origin)],
        origin,
      ),
    ],
    origin,
  );

/**
 * @type {(
 *   value: aran.Expression<unbuild.Atom> | null,
 *   writable: aran.Expression<unbuild.Atom> | null,
 *   enumerable: aran.Expression<unbuild.Atom> | null,
 *   configurable: aran.Expression<unbuild.Atom> | null,
 *   origin: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeDataDescriptorExpression = (
  value,
  writable,
  enumerable,
  configurable,
  origin,
) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.createObject", origin),
    makePrimitiveExpression({ undefined: null }, origin),
    [
      makePrimitiveExpression(null, origin),
      ...(value === null
        ? []
        : [makePrimitiveExpression("value", origin), value]),
      ...(writable === null
        ? []
        : [makePrimitiveExpression("writable", origin), writable]),
      ...(enumerable === null
        ? []
        : [makePrimitiveExpression("enumerable", origin), enumerable]),
      ...(configurable === null
        ? []
        : [makePrimitiveExpression("configurable", origin), configurable]),
    ],
    origin,
  );

/**
 * @type {(
 *   get: aran.Expression<unbuild.Atom> | null,
 *   set: aran.Expression<unbuild.Atom> | null,
 *   enumerable: aran.Expression<unbuild.Atom> | null,
 *   configurable: aran.Expression<unbuild.Atom> | null,
 *   origin: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeAccessorDescriptorExpression = (
  get,
  set,
  enumerable,
  configurable,
  origin,
) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.createObject", origin),
    makePrimitiveExpression({ undefined: null }, origin),
    flat([
      [makePrimitiveExpression(null, origin)],
      get === null ? [] : [makePrimitiveExpression("get", origin), get],
      set === null ? [] : [makePrimitiveExpression("set", origin), set],
      enumerable === null
        ? []
        : [makePrimitiveExpression("enumerable", origin), enumerable],
      configurable === null
        ? []
        : [makePrimitiveExpression("configurable", origin), configurable],
    ]),
    origin,
  );

/**
 * @type {(
 *   entry: [string, Json],
 *   origin: unbuild.Path,
 * ) => [aran.Expression<unbuild.Atom>, aran.Expression<unbuild.Atom>]}
 */
const makeJsonEntry = ([key, val], origin) => [
  makePrimitiveExpression(key, origin),
  // eslint-disable-next-line no-use-before-define
  makeJsonExpression(val, origin),
];

/**
 * @type {(
 *   json: Json,
 *   origin: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeJsonExpression = (json, origin) => {
  if (
    json === null ||
    typeof json === "boolean" ||
    typeof json === "number" ||
    typeof json === "string"
  ) {
    return makePrimitiveExpression(json, origin);
  } else if (isArray(json)) {
    return makeArrayExpression(
      map(json, (item) => makeJsonExpression(item, origin)),
      origin,
    );
  } else if (typeof json === "object") {
    return makeObjectExpression(
      makeIntrinsicExpression("Object.prototype", origin),
      map(listEntry(json), (entry) => makeJsonEntry(entry, origin)),
      origin,
    );
  } /* c8 ignore start */ else {
    throw new StaticError("invalid json", json);
  } /* c8 ignore stop */
};

/**
 * @type {(
 *   property: [string, unknown],
 *   origin: unbuild.Path,
 * ) => [aran.Expression<unbuild.Atom>, aran.Expression<unbuild.Atom>]}
 */
const makeDataProperty = ({ 0: key, 1: value }, origin) => [
  makePrimitiveExpression(key, origin),
  // eslint-disable-next-line no-use-before-define
  makeDataExpression(value, origin),
];

/**
 * @type {(
 *   data: unknown,
 *   origin: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeDataExpression = (data, origin) => {
  if (typeof data === "object" && data !== null) {
    if (isArray(data)) {
      return makeArrayExpression(
        map(data, (item) => makeDataExpression(item, origin)),
        origin,
      );
    } else {
      return makeObjectExpression(
        makePrimitiveExpression(null, origin),
        map(listEntry(data), (entry) => makeDataProperty(entry, origin)),
        origin,
      );
    }
  } else if (
    data === undefined ||
    data === null ||
    typeof data === "boolean" ||
    typeof data === "number" ||
    typeof data === "bigint" ||
    typeof data === "string"
  ) {
    return makePrimitiveExpression(packPrimitive(data), origin);
  } else {
    throw new DynamicError("cannot serialize", data);
  }
};

/**
 * @type {(
 *   effects: aran.Effect<unbuild.Atom>[],
 *   expression: aran.Expression<unbuild.Atom>,
 *   origin: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeLongSequenceExpression = (effects, expression, origin) =>
  reduceReverse(
    effects,
    (sequence, effect) => makeSequenceExpression(effect, sequence, origin),
    expression,
  );

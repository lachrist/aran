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
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeArrayExpression = (elements) =>
  makeApplyExpression(
    makeIntrinsicExpression("Array.of"),
    makePrimitiveExpression({ undefined: null }),
    elements,
  );

/**
 * @type {(
 *   operator: estree.UnaryOperator,
 *   argument: aran.Expression<unbuild.Atom>,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeUnaryExpression = (operator, argument) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.unary"),
    makePrimitiveExpression({ undefined: null }),
    [makePrimitiveExpression(operator), argument],
  );

/**
 * @type {(
 *   operator: estree.BinaryOperator,
 *   left: aran.Expression<unbuild.Atom>,
 *   right: aran.Expression<unbuild.Atom>,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeBinaryExpression = (operator, left, right) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.binary"),
    makePrimitiveExpression({ undefined: null }),
    [makePrimitiveExpression(operator), left, right],
  );

/**
 * @type {(
 *   prototype: aran.Expression<unbuild.Atom>,
 *   properties: [aran.Expression<unbuild.Atom>, aran.Expression<unbuild.Atom>][],
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeObjectExpression = (prototype, properties) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.createObject"),
    makePrimitiveExpression({ undefined: null }),
    [prototype, ...flat(properties)],
  );

/**
 * @type {(
 *   object: aran.Expression<unbuild.Atom>,
 *   key: aran.Expression<unbuild.Atom>,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeGetExpression = (object, key) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.get"),
    makePrimitiveExpression({ undefined: null }),
    [object, key],
  );

/**
 * @type {(
 *   strict: boolean,
 *   object: aran.Expression<unbuild.Atom>,
 *   key: aran.Expression<unbuild.Atom>,
 *   value: aran.Expression<unbuild.Atom>,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeSetExpression = (strict, object, key, value) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.set"),
    makePrimitiveExpression({ undefined: null }),
    [makePrimitiveExpression(strict), object, key, value],
  );

/**
 * @type {(
 *   strict: boolean,
 *   object: aran.Expression<unbuild.Atom>,
 *   key: aran.Expression<unbuild.Atom>,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeDeleteExpression = (strict, object, key) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.delete"),
    makePrimitiveExpression({ undefined: null }),
    [makePrimitiveExpression(strict), object, key],
  );

/**
 * @type {(
 *   error: aran.Expression<unbuild.Atom>,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeThrowExpression = (error) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.throw"),
    makePrimitiveExpression({ undefined: null }),
    [error],
  );

/**
 * @type {(
 *   intrinsic: aran.Intrinsic,
 *   message: string,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeThrowErrorExpression = (intrinsic, message) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.throw"),
    makePrimitiveExpression({ undefined: null }),
    [
      makeConstructExpression(makeIntrinsicExpression(intrinsic), [
        makePrimitiveExpression(message),
      ]),
    ],
  );

/**
 * @type {(
 *   value: aran.Expression<unbuild.Atom> | null,
 *   writable: aran.Expression<unbuild.Atom> | null,
 *   enumerable: aran.Expression<unbuild.Atom> | null,
 *   configurable: aran.Expression<unbuild.Atom> | null,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeDataDescriptorExpression = (
  value,
  writable,
  enumerable,
  configurable,
) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.createObject"),
    makePrimitiveExpression({ undefined: null }),
    [
      makePrimitiveExpression(null),
      ...(value === null ? [] : [makePrimitiveExpression("value"), value]),
      ...(writable === null
        ? []
        : [makePrimitiveExpression("writable"), writable]),
      ...(enumerable === null
        ? []
        : [makePrimitiveExpression("enumerable"), enumerable]),
      ...(configurable === null
        ? []
        : [makePrimitiveExpression("configurable"), configurable]),
    ],
  );

/**
 * @type {(
 *   get: aran.Expression<unbuild.Atom> | null,
 *   set: aran.Expression<unbuild.Atom> | null,
 *   enumerable: aran.Expression<unbuild.Atom> | null,
 *   configurable: aran.Expression<unbuild.Atom> | null,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeAccessorDescriptorExpression = (
  get,
  set,
  enumerable,
  configurable,
) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.createObject"),
    makePrimitiveExpression({ undefined: null }),
    flat([
      [makePrimitiveExpression(null)],
      get === null ? [] : [makePrimitiveExpression("get"), get],
      set === null ? [] : [makePrimitiveExpression("set"), set],
      enumerable === null
        ? []
        : [makePrimitiveExpression("enumerable"), enumerable],
      configurable === null
        ? []
        : [makePrimitiveExpression("configurable"), configurable],
    ]),
  );

/**
 * @type {(
 *   entry: [string, Json],
 * ) => [aran.Expression<unbuild.Atom>, aran.Expression<unbuild.Atom>]}
 */
const makeJsonEntry = ([key, val]) => [
  makePrimitiveExpression(key),
  // eslint-disable-next-line no-use-before-define
  makeJsonExpression(val),
];

/**
 * @type {(
 *   json: Json,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeJsonExpression = (json) => {
  if (
    json === null ||
    typeof json === "boolean" ||
    typeof json === "number" ||
    typeof json === "string"
  ) {
    return makePrimitiveExpression(json);
  } else if (isArray(json)) {
    return makeArrayExpression(map(json, (item) => makeJsonExpression(item)));
  } else if (typeof json === "object") {
    return makeObjectExpression(
      makeIntrinsicExpression("Object.prototype"),
      map(listEntry(json), (entry) => makeJsonEntry(entry)),
    );
  } /* c8 ignore start */ else {
    throw new StaticError("invalid json", json);
  } /* c8 ignore stop */
};

/**
 * @type {(
 *   property: [string, unknown],
 * ) => [aran.Expression<unbuild.Atom>, aran.Expression<unbuild.Atom>]}
 */
const makeDataProperty = ({ 0: key, 1: value }) => [
  makePrimitiveExpression(key),
  // eslint-disable-next-line no-use-before-define
  makeDataExpression(value),
];

/**
 * @type {(
 *   data: unknown,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeDataExpression = (data) => {
  if (typeof data === "object" && data !== null) {
    if (isArray(data)) {
      return makeArrayExpression(map(data, (item) => makeDataExpression(item)));
    } else {
      return makeObjectExpression(
        makePrimitiveExpression(null),
        map(listEntry(data), (entry) => makeDataProperty(entry)),
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
    return makePrimitiveExpression(packPrimitive(data));
  } else {
    throw new DynamicError("cannot serialize", data);
  }
};

/**
 * @type {(
 *   effects: aran.Effect<unbuild.Atom>[],
 *   expression: aran.Expression<unbuild.Atom>,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeLongSequenceExpression = (effects, expression) =>
  reduceReverse(
    effects,
    (sequence, effect) => makeSequenceExpression(effect, sequence),
    expression,
  );

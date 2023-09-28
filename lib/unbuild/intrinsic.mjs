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
 * @type {<S>(
 *   elements: aran.Expression<unbuild.Atom<S>>[],
 *   tag: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeArrayExpression = (elements, tag) =>
  makeApplyExpression(
    makeIntrinsicExpression("Array.of", tag),
    makePrimitiveExpression({ undefined: null }, tag),
    elements,
    tag,
  );

/**
 * @type {<S>(
 *   operator: estree.UnaryOperator,
 *   argument: aran.Expression<unbuild.Atom<S>>,
 *   tag: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeUnaryExpression = (operator, argument, tag) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.unary", tag),
    makePrimitiveExpression({ undefined: null }, tag),
    [makePrimitiveExpression(operator, tag), argument],
    tag,
  );

/**
 * @type {<S>(
 *   operator: estree.BinaryOperator,
 *   left: aran.Expression<unbuild.Atom<S>>,
 *   right: aran.Expression<unbuild.Atom<S>>,
 *   tag: S
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeBinaryExpression = (operator, left, right, tag) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.binary", tag),
    makePrimitiveExpression({ undefined: null }, tag),
    [makePrimitiveExpression(operator, tag), left, right],
    tag,
  );

/**
 * @type {<S>(
 *   prototype: aran.Expression<unbuild.Atom<S>>,
 *   properties: [aran.Expression<unbuild.Atom<S>>, aran.Expression<unbuild.Atom<S>>][],
 *   tag: S
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeObjectExpression = (prototype, properties, tag) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.createObject", tag),
    makePrimitiveExpression({ undefined: null }, tag),
    [prototype, ...flat(properties)],
    tag,
  );

/**
 * @type {<S>(
 *   object: aran.Expression<unbuild.Atom<S>>,
 *   key: aran.Expression<unbuild.Atom<S>>,
 *   tag: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeGetExpression = (object, key, tag) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.get", tag),
    makePrimitiveExpression({ undefined: null }, tag),
    [object, key],
    tag,
  );

/**
 * @type {<S>(
 *   strict: boolean,
 *   object: aran.Expression<unbuild.Atom<S>>,
 *   key: aran.Expression<unbuild.Atom<S>>,
 *   value: aran.Expression<unbuild.Atom<S>>,
 *   tag: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeSetExpression = (strict, object, key, value, tag) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.set", tag),
    makePrimitiveExpression({ undefined: null }, tag),
    [makePrimitiveExpression(strict, tag), object, key, value],
    tag,
  );

/**
 * @type {<S>(
 *   strict: boolean,
 *   object: aran.Expression<unbuild.Atom<S>>,
 *   key: aran.Expression<unbuild.Atom<S>>,
 *   tag: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeDeleteExpression = (strict, object, key, tag) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.delete", tag),
    makePrimitiveExpression({ undefined: null }, tag),
    [makePrimitiveExpression(strict, tag), object, key],
    tag,
  );

/**
 * @type {<S>(
 *   error: aran.Expression<unbuild.Atom<S>>,
 *   tag: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeThrowExpression = (error, tag) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.throw", tag),
    makePrimitiveExpression({ undefined: null }, tag),
    [error],
    tag,
  );

/**
 * @type {<S>(
 *   intrinsic: aran.Intrinsic,
 *   message: string,
 *   tag: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
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
 * @type {<S>(
 *   value: aran.Expression<unbuild.Atom<S>> | null,
 *   writable: aran.Expression<unbuild.Atom<S>> | null,
 *   enumerable: aran.Expression<unbuild.Atom<S>> | null,
 *   configurable: aran.Expression<unbuild.Atom<S>> | null,
 *   tag: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeDataDescriptorExpression = (
  value,
  writable,
  enumerable,
  configurable,
  tag,
) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.createObject", tag),
    makePrimitiveExpression({ undefined: null }, tag),
    [
      makePrimitiveExpression(null, tag),
      ...(value === null ? [] : [makePrimitiveExpression("value", tag), value]),
      ...(writable === null
        ? []
        : [makePrimitiveExpression("writable", tag), writable]),
      ...(enumerable === null
        ? []
        : [makePrimitiveExpression("enumerable", tag), enumerable]),
      ...(configurable === null
        ? []
        : [makePrimitiveExpression("configurable", tag), configurable]),
    ],
    tag,
  );

/**
 * @type {<S>(
 *   get: aran.Expression<unbuild.Atom<S>> | null,
 *   set: aran.Expression<unbuild.Atom<S>> | null,
 *   enumerable: aran.Expression<unbuild.Atom<S>> | null,
 *   configurable: aran.Expression<unbuild.Atom<S>> | null,
 *   tag: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeAccessorDescriptorExpression = (
  get,
  set,
  enumerable,
  configurable,
  tag,
) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.createObject", tag),
    makePrimitiveExpression({ undefined: null }, tag),
    flat([
      [makePrimitiveExpression(null, tag)],
      get === null ? [] : [makePrimitiveExpression("get", tag), get],
      set === null ? [] : [makePrimitiveExpression("set", tag), set],
      enumerable === null
        ? []
        : [makePrimitiveExpression("enumerable", tag), enumerable],
      configurable === null
        ? []
        : [makePrimitiveExpression("configurable", tag), configurable],
    ]),
    tag,
  );

/**
 * @type {<S>(
 *   entry: [string, Json],
 *   tag: S,
 * ) => [aran.Expression<unbuild.Atom<S>>, aran.Expression<unbuild.Atom<S>>]}
 */
const makeJsonEntry = ([key, val], tag) => [
  makePrimitiveExpression(key, tag),
  // eslint-disable-next-line no-use-before-define
  makeJsonExpression(val, tag),
];

/**
 * @type {<S>(
 *   json: Json,
 *   tag: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeJsonExpression = (json, tag) => {
  if (
    json === null ||
    typeof json === "boolean" ||
    typeof json === "number" ||
    typeof json === "string"
  ) {
    return makePrimitiveExpression(json, tag);
  } else if (isArray(json)) {
    return makeArrayExpression(
      map(json, (item) => makeJsonExpression(item, tag)),
      tag,
    );
  } else if (typeof json === "object") {
    return makeObjectExpression(
      makeIntrinsicExpression("Object.prototype", tag),
      map(listEntry(json), (entry) => makeJsonEntry(entry, tag)),
      tag,
    );
  } /* c8 ignore start */ else {
    throw new StaticError("invalid json", json);
  } /* c8 ignore stop */
};

/**
 * @type {<S>(
 *   property: [string, unknown],
 *   tag: S,
 * ) => [aran.Expression<unbuild.Atom<S>>, aran.Expression<unbuild.Atom<S>>]}
 */
const makeDataProperty = ({ 0: key, 1: value }, tag) => [
  makePrimitiveExpression(key, tag),
  // eslint-disable-next-line no-use-before-define
  makeDataExpression(value, tag),
];

/**
 * @type {<S>(
 *   data: unknown,
 *   tag: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeDataExpression = (data, tag) => {
  if (typeof data === "object" && data !== null) {
    if (isArray(data)) {
      return makeArrayExpression(
        map(data, (item) => makeDataExpression(item, tag)),
        tag,
      );
    } else {
      return makeObjectExpression(
        makePrimitiveExpression(null, tag),
        map(listEntry(data), (entry) => makeDataProperty(entry, tag)),
        tag,
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
    return makePrimitiveExpression(packPrimitive(data), tag);
  } else {
    throw new DynamicError("cannot serialize", data);
  }
};

/**
 * @type {<S>(
 *   effects: aran.Effect<unbuild.Atom<S>>[],
 *   expression: aran.Expression<unbuild.Atom<S>>,
 *   serial: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeLongSequenceExpression = (effects, expression, serial) =>
  reduceReverse(
    effects,
    (sequence, effect) => makeSequenceExpression(effect, sequence, serial),
    expression,
  );

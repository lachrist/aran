import { DynamicError, StaticError, flat, map } from "./util/index.mjs";

import {
  makeApplyExpression,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeConstructExpression,
  packPrimitive,
} from "./node.mjs";

const {
  undefined,
  Object: { entries: listEntry },
  Array: { isArray },
} = globalThis;

/** @type {<T>(elements: Expression<T>[], tag: T) => Expression<T>} */
export const makeArrayExpression = (elements, tag) =>
  makeApplyExpression(
    makeIntrinsicExpression("Array.of", tag),
    makePrimitiveExpression({ undefined: null }, tag),
    elements,
    tag,
  );

/** @type {<T>(operator: EstreeUnaryOperator, argument: Expression<T>, tag: T) => Expression<T>} */
export const makeUnaryExpression = (operator, argument, tag) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.unary", tag),
    makePrimitiveExpression({ undefined: null }, tag),
    [makePrimitiveExpression(operator, tag), argument],
    tag,
  );

/**
 * @type {<T>(
 *   operator: EstreeBinaryOperator,
 *   left: Expression<T>,
 *   right: Expression<T>,
 *   tag: T
 * ) => Expression<T>}
 */
export const makeBinaryExpression = (operator, left, right, tag) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.binary", tag),
    makePrimitiveExpression({ undefined: null }, tag),
    [makePrimitiveExpression(operator, tag), left, right],
    tag,
  );

/**
 * @type {<T>(
 *   prototype: Expression<T>,
 *   properties: [Expression<T>, Expression<T>][],
 *   tag: T
 * ) => Expression<T>}
 */
export const makeObjectExpression = (prototype, properties, tag) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.createObject", tag),
    makePrimitiveExpression({ undefined: null }, tag),
    [prototype, ...flat(properties)],
    tag,
  );

/**
 * @type {<T>(
 *   object: Expression<T>,
 *   key: Expression<T>,
 *   tag: T,
 * ) => Expression<T>}
 */
export const makeGetExpression = (object, key, tag) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.get", tag),
    makePrimitiveExpression({ undefined: null }, tag),
    [object, key],
    tag,
  );

/**
 * @type {<T>(
 *   strict: boolean,
 *   object: Expression<T>,
 *   key: Expression<T>,
 *   value: Expression<T>,
 *   tag: T,
 * ) => Expression<T>}
 */
export const makeSetExpression = (strict, object, key, value, tag) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.set", tag),
    makePrimitiveExpression({ undefined: null }, tag),
    [makePrimitiveExpression(strict, tag), object, key, value],
    tag,
  );

/**
 * @type {<T>(
 *   strict: boolean,
 *   object: Expression<T>,
 *   key: Expression<T>,
 *   tag: T,
 * ) => Expression<T>}
 */
export const makeDeleteExpression = (strict, object, key, tag) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.delete", tag),
    makePrimitiveExpression({ undefined: null }, tag),
    [makePrimitiveExpression(strict, tag), object, key],
    tag,
  );

/** @type {<T>(error: Expression<T>, tag: T) => Expression<T>} */
export const makeThrowExpression = (error, tag) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.throw", tag),
    makePrimitiveExpression({ undefined: null }, tag),
    [error],
    tag,
  );

/**
 * @type {<T>(
 *   intrinsic: Intrinsic,
 *   message: string,
 *   tag: T,
 * ) => Expression<T>}
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
 * @type {<T>(
 *   property: [PropertyKey, unknown],
 *   tag: T,
 * ) => [Expression<T>, Expression<T>]}
 */
const makeDataProperty = ({ 0: key, 1: value }, tag) => {
  if (typeof key === "symbol") {
    throw new DynamicError("cannot serialize symbol key", key);
  }
  // eslint-disable-next-line no-use-before-define
  return [makePrimitiveExpression(key, tag), makeDataExpression(value, tag)];
};

/** @type {<T>(data: unknown, tag: T) => Expression<T>}*/
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
 * @type {<T>(
 *   value: Expression<T> | null,
 *   writable: Expression<T> | null,
 *   enumerable: Expression<T> | null,
 *   configurable: Expression<T> | null,
 *   tag: T,
 * ) => Expression<T>}
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
 * @type {<T>(
 *   get: Expression<T> | null,
 *   set: Expression<T> | null,
 *   enumerable: Expression<T> | null,
 *   configurable: Expression<T> | null,
 *   tag: T,
 * ) => Expression<T>}
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

/** @type {<T>(entry: [string, Json], tag: T) => [Expression<T>, Expression<T>]} */
export const makeJsonEntry = ([key, val], tag) => [
  makePrimitiveExpression(key, tag),
  // eslint-disable-next-line no-use-before-define
  makeJsonExpression(val, tag),
];

/** @type {<T>(json: Json, tag: T) => Expression<T>} */
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
  } else {
    throw new StaticError("invalid json", json);
  }
};

// export const makeReflectDefinePropertyExpressin = (
//   object,
//   key,
//   descriptor,
//   tag,
// ) =>
//   makeApplyExpression(
//     makeIntrinsicExpression("Reflect.defineProperty"),
//     makePrimitiveExpression({ undefined: null }),
//     [object, key, descriptor],
//     tag,
//   );

// export const makeReflectSetPrototypeOfExpression = (object, prototype, tag) =>
//   makeApplyExpression(
//     makeIntrinsicExpression("Reflect.setPrototypeOf"),
//     makePrimitiveExpression({ undefined: null }),
//     [object, prototype],
//     tag,
//   );

// export const makeArrayFromExpression = (argument, tag) =>
//   makeApplyExpression(
//     makeIntrinsicExpression("Array.from"),
//     makePrimitiveExpression({ undefined: null }),
//     [argument],
//     tag,
//   );

////////////
// Object //
////////////

// Compared to Reflect, Object methods sometimes lead
// to more efficient transpiled code because they
// return the object and allow operation chaining.

// export const makeObjectFreezeExpression = partialx__(
//   makeIntrinsicApplyExpression1,
//   "Object.freeze",
// );

// export const makeObjectDefinePropertyExpression = partialx____(
//   makeIntrinsicApplyExpression3,
//   "Object.defineProperty",
// );

// export const makeObjectAssignExpression = partialx___(
//   makeIntrinsicApplyExpression2,
//   "Object.assign",
// );

//////////
// Data //
//////////

// const intrinsics = [
//   "aran.globalCache",
//   "aran.globalObject",
//   "aran.globalRecord",
//   "aran.deadzone",
//   "Symbol.iterator",
//   "Symbol.unscopables",
// ];
//
// export const makeIntrinsicExpression = (name) => {
//   assert(includes(intrinsics, name), "invalid direct intrinsic expression");
//   return makeRawIntrinsicExpression(name);
// };
//
//
// export const makeGlobalCacheExpression = partialx(
//   makeIntrinsicExpression,
//   "aran.globalCache",
// );
//
// export const makeGlobalObjectExpression = partialx(
//   makeIntrinsicExpression,
//   "aran.globalObject",
// );
//
// export const makeGlobalRecordExpression = partialx(
//   makeIntrinsicExpression,
//   "aran.globalRecord",
// );
//
// export const makeDeadzoneExpression = partialx(
//   makeIntrinsicExpression,
//   "aran.deadzone",
// );
//
// export const makeSymbolIteratorExpression = partialx(
//   makeIntrinsicExpression,
//   "Symbol.iterator",
// );
//
// export const makeSymbolUnscopablesExpression = partialx(
//   makeIntrinsicExpression,
//   "Symbol.unscopables",
// );

///////////
// Macro //
///////////

// export const makeIsNullishExpression = (pure) =>
//   makeConditionalExpression(
//     makeBinaryExpression("===", pure, makeLiteralExpression(null)),
//     makeLiteralExpression(true),
//     makeBinaryExpression(
//       "===",
//       pure,
//       makeLiteralExpression({ undefined: null }),
//     ),
//   );

////////////
// Global //
////////////

// export const makeTypeofGlobalExpression = partialxf_(
//   makeIntrinsicApplyExpression1,
//   "aran.typeofGlobal",
//   makeLiteralExpression,
// );
//
// export const makeReadGlobalExpression = partialxf_(
//   makeIntrinsicApplyExpression1,
//   "aran.readGlobal",
//   makeLiteralExpression,
// );
//
// export const makeDiscardGlobalSloppyExpression = partialxf_(
//   makeIntrinsicApplyExpression1,
//   "aran.discardGlobalSloppy",
//   makeLiteralExpression,
// );
//
// export const makeDiscardGlobalExpression = (
//   strict,
//   variable,
//   annotation = undefined,
// ) => {
//   assert(!strict, "unexpected strict global delete");
//   return makeDiscardGlobalSloppyExpression(variable, annotation);
// };
//
// export const makeWriteGlobalStrictExpression = partialxf__(
//   makeIntrinsicApplyExpression2,
//   "aran.writeGlobalStrict",
//   makeLiteralExpression,
// );
//
// export const makeWriteGlobalSloppyExpression = partialxf__(
//   makeIntrinsicApplyExpression2,
//   "aran.writeGlobalSloppy",
//   makeLiteralExpression,
// );
//
// export const makeWriteGlobalExpression = partialxx_f__(
//   makeDualIntrinsicApplyExpression2,
//   "aran.writeGlobalStrict",
//   "aran.writeGlobalSloppy",
//   makeLiteralExpression,
// );

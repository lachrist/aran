import { DynamicError, StaticError, flat, map } from "./util/index.mjs";

import {
  makeApplyExpression,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeConstructExpression,
  packPrimitive,
} from "./syntax.mjs";

const {
  Object: { entries: listEntry },
  Array: { isArray },
} = globalThis;

/** @type {(elements: Expression[]) => Expression} */
export const makeArrayExpression = (elements) =>
  makeApplyExpression(
    makeIntrinsicExpression("Array.of"),
    makePrimitiveExpression({ undefined: null }),
    elements,
  );

/** @type {(operator: EstreeUnaryOperator, argument: Expression) => Expression} */
export const makeUnaryExpression = (operator, argument) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.unary"),
    makePrimitiveExpression({ undefined: null }),
    [makePrimitiveExpression(operator), argument],
  );

/**
 * @type {(
 *   operator: EstreeBinaryOperator,
 *   left: Expression,
 *   right: Expression,
 * ) => Expression}
 */
export const makeBinaryExpression = (operator, left, right) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.binary"),
    makePrimitiveExpression({ undefined: null }),
    [makePrimitiveExpression(operator), left, right],
  );

/**
 * @type {(
 *   prototype: Expression,
 *   properties: [Expression, Expression][],
 * ) => Expression}
 */
export const makeObjectExpression = (prototype, properties) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.createObject"),
    makePrimitiveExpression({ undefined: null }),
    flat([[prototype], flat(properties)]),
  );

/**
 * @type {(
 *   object: Expression,
 *   key: Expression,
 * ) => Expression}
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
 *   object: Expression,
 *   key: Expression,
 *   value: Expression,
 * ) => Expression}
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
 *   object: Expression,
 *   key: Expression,
 * ) => Expression}
 */
export const makeDeleteExpression = (strict, object, key) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.delete"),
    makePrimitiveExpression({ undefined: null }),
    [makePrimitiveExpression(strict), object, key],
  );

/** @type {(error: Expression) => Expression} */
export const makeThrowExpression = (error) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.throw"),
    makePrimitiveExpression({ undefined: null }),
    [error],
  );

/**
 * @type {(
 *   intrinsic: Intrinsic,
 *   message: string,
 * ) => Expression}
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

/** @type {(property: [PropertyKey, unknown]) => [Expression, Expression]} */
const makeDataProperty = ({ 0: key, 1: value }) => {
  if (typeof key === "symbol") {
    throw new DynamicError("cannot serialize symbol key", key);
  }
  // eslint-disable-next-line no-use-before-define
  return [makePrimitiveExpression(key), makeDataExpression(value)];
};

/**
 * @template T
 * @param {unknown} data
 * @returns {Expression}
 * */
export const makeDataExpression = (data) => {
  if (typeof data === "object" && data !== null) {
    if (isArray(data)) {
      return /** @type {Expression} */ (
        makeArrayExpression(map(data, makeDataExpression))
      );
    } else {
      return /** @type {Expression} */ (
        makeObjectExpression(
          makePrimitiveExpression(null),
          map(listEntry(data), makeDataProperty),
        )
      );
    }
  } else if (typeof data === "function" || typeof data === "symbol") {
    throw new DynamicError("cannot serialize", data);
  } else {
    return makePrimitiveExpression(
      packPrimitive(
        /** @type {undefined | null | boolean | number | bigint | string} */ (
          data
        ),
      ),
    );
  }
};

/**
 * @type {(
 *   value: Expression | null,
 *   writable: Expression | null,
 *   enumerable: Expression | null,
 *   configurable: Expression | null,
 * ) => Expression}
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
    flat([
      [makePrimitiveExpression(null)],
      value === null ? [] : [makePrimitiveExpression("value"), value],
      writable === null ? [] : [makePrimitiveExpression("writable"), writable],
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
 *   get: Expression | null,
 *   set: Expression | null,
 *   enumerable: Expression | null,
 *   configurable: Expression | null,
 * ) => Expression}
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

/** @type {(entry: [string, Json]) => [Expression, Expression]} */
export const makeJsonEntry = ([key, val]) => [
  makePrimitiveExpression(key),
  // eslint-disable-next-line no-use-before-define
  makeJsonExpression(val),
];

/** @type {(json: Json) => Expression} */
export const makeJsonExpression = (json) => {
  if (
    json === null ||
    typeof json === "boolean" ||
    typeof json === "number" ||
    typeof json === "string"
  ) {
    return makePrimitiveExpression(json);
  } else if (isArray(json)) {
    return makeArrayExpression(map(json, makeJsonExpression));
  } else if (typeof json === "object") {
    return makeObjectExpression(
      makeIntrinsicExpression("Object.prototype"),
      map(listEntry(json), makeJsonEntry),
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

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

/**
 * @type {<A extends aran.Atom>(
 *   elements: aran.Expression<A>[],
 *   tag: A["Tag"],
 * ) => aran.Expression<A>}
 */
export const makeArrayExpression = (elements, tag) =>
  makeApplyExpression(
    makeIntrinsicExpression("Array.of", tag),
    makePrimitiveExpression({ undefined: null }, tag),
    elements,
    tag,
  );

/**
 * @type {<A extends aran.Atom>(
 *   operator: estree.UnaryOperator,
 *   argument: aran.Expression<A>,
 *   tag: A["Tag"],
 * ) => aran.Expression<A>}
 */
export const makeUnaryExpression = (operator, argument, tag) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.unary", tag),
    makePrimitiveExpression({ undefined: null }, tag),
    [makePrimitiveExpression(operator, tag), argument],
    tag,
  );

/**
 * @type {<A extends aran.Atom>(
 *   operator: estree.BinaryOperator,
 *   left: aran.Expression<A>,
 *   right: aran.Expression<A>,
 *   tag: A["Tag"]
 * ) => aran.Expression<A>}
 */
export const makeBinaryExpression = (operator, left, right, tag) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.binary", tag),
    makePrimitiveExpression({ undefined: null }, tag),
    [makePrimitiveExpression(operator, tag), left, right],
    tag,
  );

/**
 * @type {<A extends aran.Atom>(
 *   prototype: aran.Expression<A>,
 *   properties: [aran.Expression<A>, aran.Expression<A>][],
 *   tag: A["Tag"]
 * ) => aran.Expression<A>}
 */
export const makeObjectExpression = (prototype, properties, tag) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.createObject", tag),
    makePrimitiveExpression({ undefined: null }, tag),
    [prototype, ...flat(properties)],
    tag,
  );

/**
 * @type {<A extends aran.Atom>(
 *   object: aran.Expression<A>,
 *   key: aran.Expression<A>,
 *   tag: A["Tag"],
 * ) => aran.Expression<A>}
 */
export const makeGetExpression = (object, key, tag) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.get", tag),
    makePrimitiveExpression({ undefined: null }, tag),
    [object, key],
    tag,
  );

/**
 * @type {<A extends aran.Atom>(
 *   strict: boolean,
 *   object: aran.Expression<A>,
 *   key: aran.Expression<A>,
 *   value: aran.Expression<A>,
 *   tag: A["Tag"],
 * ) => aran.Expression<A>}
 */
export const makeSetExpression = (strict, object, key, value, tag) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.set", tag),
    makePrimitiveExpression({ undefined: null }, tag),
    [makePrimitiveExpression(strict, tag), object, key, value],
    tag,
  );

/**
 * @type {<A extends aran.Atom>(
 *   strict: boolean,
 *   object: aran.Expression<A>,
 *   key: aran.Expression<A>,
 *   tag: A["Tag"],
 * ) => aran.Expression<A>}
 */
export const makeDeleteExpression = (strict, object, key, tag) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.delete", tag),
    makePrimitiveExpression({ undefined: null }, tag),
    [makePrimitiveExpression(strict, tag), object, key],
    tag,
  );

/**
 * @type {<A extends aran.Atom>(
 *   error: aran.Expression<A>,
 *   tag: A["Tag"],
 * ) => aran.Expression<A>}
 */
export const makeThrowExpression = (error, tag) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.throw", tag),
    makePrimitiveExpression({ undefined: null }, tag),
    [error],
    tag,
  );

/**
 * @type {<A extends aran.Atom>(
 *   intrinsic: aran.Intrinsic,
 *   message: string,
 *   tag: A["Tag"],
 * ) => aran.Expression<A>}
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
 * @type {<A extends aran.Atom>(
 *   value: aran.Expression<A> | null,
 *   writable: aran.Expression<A> | null,
 *   enumerable: aran.Expression<A> | null,
 *   configurable: aran.Expression<A> | null,
 *   tag: A["Tag"],
 * ) => aran.Expression<A>}
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
 * @type {<A extends aran.Atom>(
 *   get: aran.Expression<A> | null,
 *   set: aran.Expression<A> | null,
 *   enumerable: aran.Expression<A> | null,
 *   configurable: aran.Expression<A> | null,
 *   tag: A["Tag"],
 * ) => aran.Expression<A>}
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
 * @type {<A extends aran.Atom>(
 *   entry: [string, Json],
 *   tag: A["Tag"],
 * ) => [aran.Expression<A>, aran.Expression<A>]}
 */
const makeJsonEntry = ([key, val], tag) => [
  makePrimitiveExpression(key, tag),
  // eslint-disable-next-line no-use-before-define
  makeJsonExpression(val, tag),
];

/**
 * @type {<A extends aran.Atom>(
 *   json: Json,
 *   tag: A["Tag"],
 * ) => aran.Expression<A>}
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
 * @type {<A extends aran.Atom>(
 *   property: [string, unknown],
 *   tag: A["Tag"],
 * ) => [aran.Expression<A>, aran.Expression<A>]}
 */
const makeDataProperty = ({ 0: key, 1: value }, tag) => [
  makePrimitiveExpression(key, tag),
  // eslint-disable-next-line no-use-before-define
  makeDataExpression(value, tag),
];

/**
 * @type {<A extends aran.Atom>(
 *   data: unknown,
 *   tag: A["Tag"],
 * ) => aran.Expression<A>}
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

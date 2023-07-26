import { hasOwn } from "./util/index.mjs";

const { Error, BigInt, String, undefined } = globalThis;

/** @type {(primitive: Primitive) => PackPrimitive} */
export const packPrimitive = (primitive) => {
  if (primitive === undefined) {
    return { undefined: null };
  } else if (typeof primitive === "bigint") {
    return { bigint: String(primitive) };
  } else {
    return primitive;
  }
};

/** @type {(primitive: PackPrimitive) => Primitive} */
export const unpackPrimitive = (primitive) => {
  if (typeof primitive === "object" && primitive !== null) {
    if (hasOwn(primitive, "undefined")) {
      return undefined;
    } else if (hasOwn(primitive, "bigint")) {
      return BigInt(primitive.bigint);
    } else {
      throw new Error("invalid primitive");
    }
  } else {
    return primitive;
  }
};

/** @type {Intrinsic[]} */
export const intrinsics = [
  // Aran //
  "aran.globalCache",
  "aran.globalRecord",
  "aran.globalObject",
  "aran.unary",
  "aran.binary",
  "aran.throw",
  "aran.createObject",
  "aran.get",
  "aran.setStrict",
  "aran.setSloppy",
  "aran.deleteStrict",
  "aran.deleteSloppy",
  "aran.deadzone",
  "aran.AranError",
  "aran.asynchronousGeneratorPrototype",
  "aran.generatorPrototype",
  // Grabbable //
  "globalThis",
  "Object", // Convertion inside destructuring pattern + super
  "Reflect.defineProperty", // Proxy Arguments trap :(
  "eval",
  "Symbol",
  "Symbol.unscopables",
  "Symbol.asyncIterator",
  "Symbol.iterator",
  "Symbol.isConcatSpreadable",
  "Function.prototype.arguments@get",
  "Function.prototype.arguments@set",
  "Array.prototype.values",
  "Object.prototype",
  // Convertion //
  "String",
  // Object
  "Array.from",
  "Array.prototype.flat",
  // Construction //
  "Object.create",
  "Array.of",
  "Proxy",
  "RegExp",
  "TypeError",
  "ReferenceError",
  "SyntaxError",
  // Readers //
  "Reflect.get",
  "Reflect.has",
  "Reflect.construct",
  "Reflect.apply",
  "Reflect.setProtoypeOf",
  "Reflect.getPrototypeOf",
  "Reflect.ownKeys",
  "Reflect.isExtensible",
  "Object.keys",
  "Array.prototype.concat",
  "Array.prototype.includes",
  "Array.prototype.slice",
  // Writers //
  "Reflect.set",
  "Reflect.deleteProperty",
  "Reflect.setPrototypeOf",
  // "Reflect.defineProperty",
  "Reflect.getOwnPropertyDescriptor",
  "Reflect.preventExtensions",
  "Object.assign",
  "Object.freeze",
  "Object.defineProperty",
  "Object.setPrototypeOf",
  "Object.preventExtensions",
  "Array.prototype.fill",
  "Array.prototype.push",
];

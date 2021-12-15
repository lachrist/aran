const {
  Error,
  String,
  BigInt,
  undefined,
  Object: {prototype: object_prototype},
  Reflect: {ownKeys, getPrototypeOf, apply, getOwnPropertyDescriptor},
  RegExp: {
    prototype: {test: testRegExp},
  },
} = globalThis;

export const isLiteral = (any) =>
  any === null ||
  typeof any === "boolean" ||
  typeof any === "number" ||
  typeof any === "string" ||
  (typeof any === "object" &&
    getPrototypeOf(any) === object_prototype &&
    ownKeys(any).length === 1 &&
    ((getOwnPropertyDescriptor(any, "undefined") !== undefined &&
      any.undefined === null) ||
      (getOwnPropertyDescriptor(any, "bigint") !== undefined &&
        typeof any.bigint === "string" &&
        apply(testRegExp, /^(0|([1-9][0-9]*))$/u, [any.bigint]))));

export const toLiteral = (primitive) => {
  if (primitive === undefined) {
    return {undefined: null};
  }
  if (typeof primitive === "bigint") {
    return {bigint: String(primitive)};
  }
  return primitive;
};

export const fromLiteral = (literal) => {
  if (typeof literal === "object" && literal !== null) {
    if (getOwnPropertyDescriptor(literal, "undefined") !== undefined) {
      return undefined;
    }
    if (getOwnPropertyDescriptor(literal, "bigint") !== undefined) {
      return BigInt(literal.bigint);
    }
    throw new Error("invalid literal");
  }
  return literal;
};

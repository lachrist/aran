import { join, map } from "array-lite";
import { assert } from "./assert.mjs";
import { partial_x } from "./closure.mjs";

const {
  undefined,
  Error,
  String,
  String: {
    prototype: { replace },
  },
  Array: { isArray },
  JSON: { stringify },
  Reflect: { apply, getOwnPropertyDescriptor },
  Object: {
    entries: toEntries,
    /* c8 ignore start */
    hasOwn = (object, property) =>
      getOwnPropertyDescriptor(object, property) !== undefined,
    /* c8 ignore stop */
  },
} = globalThis;

/* eslint-disable no-use-before-define */
export const inspectEntry = ({ 0: key, 1: value }, level) =>
  `${String(key)}:${inspect(value, level)}`;
/* eslint-enable no-use-before-define */

export const inspect = (value, level) => {
  if (typeof value === "string") {
    return stringify(value);
  } else if (typeof value === "function") {
    if (level === 0) {
      return "<function>";
    } else if (typeof value.name === "string" && value.name !== "") {
      return `<function ${value.name}>`;
    } else {
      return "<function>";
    }
  } else if (typeof value === "object" && value !== null) {
    if (level === 0) {
      return isArray(value) ? "<array>" : "<object>";
    } else {
      if (isArray(value)) {
        return `[${join(map(value, partial_x(inspect, level - 1)), ", ")}]`;
      } else {
        return `{ ${join(
          map(toEntries(value), partial_x(inspectEntry, level - 1)),
          ", ",
        )} }`;
      }
    }
  } else {
    return String(value);
  }
};

export const inspect0 = partial_x(inspect, 0);
export const inspect1 = partial_x(inspect, 1);
export const inspect2 = partial_x(inspect, 2);
export const inspect3 = partial_x(inspect, 3);

/* eslint-disable no-restricted-syntax */
export class AranError extends Error {}
export class SyntaxAranError extends AranError {
  constructor(message) {
    super(message);
    this.name = "SyntaxAranError";
  }
}
export class EnclaveLimitationAranError extends AranError {
  constructor(message) {
    super(message);
    this.name = "EnclaveLimitationAranError";
  }
}
export class InvalidOptionAranError extends AranError {
  constructor(message) {
    super(message);
    this.name = "InvalidOptionAranError";
  }
}
/* eslint-enable no-restricted-syntax  */

export const format = (template, values) => {
  let index = 0;
  const message = apply(replace, template, [
    /%x/gu,
    () => {
      assert(index < values.length, "missing format value");
      index += 1;
      return values[index - 1];
    },
  ]);
  assert(index === values.length, "missing format marker");
  return message;
};

export const expect0 = (check, Constructor, template) => {
  if (!check) {
    throw new Constructor(format(template, []));
  }
  if (hasOwn(globalThis, "ARAN_DEBUG")) {
    format(template, []);
  }
};

export const expect1 = (check, Constructor, template, toString, value) => {
  if (!check) {
    throw new Constructor(format(template, [toString(value)]));
  }
  if (hasOwn(globalThis, "ARAN_DEBUG")) {
    format(template, [toString(value)]);
  }
};

export const expect2 = (
  check,
  Constructor,
  template,
  toString1,
  value1,
  toString2,
  value2,
) => {
  if (!check) {
    throw new Constructor(
      format(template, [toString1(value1), toString2(value2)]),
    );
  }
  if (hasOwn(globalThis, "ARAN_DEBUG")) {
    format(template, [toString1(value1), toString2(value2)]);
  }
};

export const expect3 = (
  check,
  Constructor,
  template,
  toString1,
  value1,
  toString2,
  value2,
  toString3,
  value3,
) => {
  if (!check) {
    throw new Constructor(
      format(template, [
        toString1(value1),
        toString2(value2),
        toString3(value3),
      ]),
    );
  }
  if (hasOwn(globalThis, "ARAN_DEBUG")) {
    format(template, [toString1(value1), toString2(value2), toString3(value3)]);
  }
};

export const expect4 = (
  check,
  Constructor,
  template,
  toString1,
  value1,
  toString2,
  value2,
  toString3,
  value3,
  toString4,
  value4,
) => {
  if (!check) {
    throw new Constructor(
      format(template, [
        toString1(value1),
        toString2(value2),
        toString3(value3),
        toString4(value4),
      ]),
    );
  }
  if (hasOwn(globalThis, "ARAN_DEBUG")) {
    format(template, [
      toString1(value1),
      toString2(value2),
      toString3(value3),
      toString4(value4),
    ]);
  }
};

export const expect5 = (
  check,
  Constructor,
  template,
  toString1,
  value1,
  toString2,
  value2,
  toString3,
  value3,
  toString4,
  value4,
  toString5,
  value5,
) => {
  if (!check) {
    throw new Constructor(
      format(template, [
        toString1(value1),
        toString2(value2),
        toString3(value3),
        toString4(value4),
        toString5(value5),
      ]),
    );
  }
  if (hasOwn(globalThis, "ARAN_DEBUG")) {
    format(template, [
      toString1(value1),
      toString2(value2),
      toString3(value3),
      toString4(value4),
      toString5(value5),
    ]);
  }
};

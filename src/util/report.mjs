import { concat } from "array-lite";
import { assert } from "./assert.mjs";

const {
  JSON: { stringify },
  Reflect: { apply, getOwnPropertyDescriptor },
  Object: {
    prototype: { toString: toObjectString },
  },
  Error,
  String,
  String: {
    prototype: { substring, replace },
  },
  undefined,
} = globalThis;

const EMPTY_ARRAY = [];

const ONE_ARRAY = [1];

export const inspect = (value) => {
  if (typeof value === "string") {
    return stringify(value);
  }
  if (
    typeof value === "function" ||
    (typeof value === "object" && value !== null)
  ) {
    return apply(toObjectString, value, EMPTY_ARRAY);
  }
  return String(value);
};

export const format = (template, values) => {
  let index = 0;
  const message = apply(replace, template, [
    /(%+)($|[^%])/gu,
    (_match, escape, marker) => {
      if (escape.length >= 2) {
        return `${apply(substring, escape, ONE_ARRAY)}${marker}`;
      }
      assert(index < values.length, "missing format value");
      const value = values[index];
      index += 1;
      if (marker === "s") {
        assert(typeof value === "string", "expected a string for format");
        return value;
      }
      if (marker === "e") {
        assert(
          typeof value === "object" && value !== null,
          "expected an object",
        );
        const descriptor = getOwnPropertyDescriptor(value, "message");
        assert(descriptor !== undefined, "missing 'message' property");
        assert(
          getOwnPropertyDescriptor(descriptor, "value") !== undefined,
          "'message' property is an accessor",
        );
        const { value: error_message } = descriptor;
        assert(
          typeof error_message === "string",
          "expected 'message' property value to be a string",
        );
        return error_message;
      }
      if (marker === "j") {
        return stringify(value);
      }
      if (marker === "o") {
        return inspect(value);
      }
      if (marker === "v") {
        return "";
      }
      throw new Error("invalid format marker");
    },
  ]);
  assert(index === values.length, "missing format marker");
  return message;
};

/* eslint-disable no-restricted-syntax */
export class AranError extends Error {}
export class SyntaxAranError extends AranError {}
export class EnclaveLimitationAranError extends AranError {}
export class InvalidOptionAranError extends AranError {}
/* eslint-enable no-restricted-syntax  */

export const expect0 = (check, Constructor, template) => {
  if (!check) {
    throw new Constructor(format(template, []));
  }
};

export const expect1 = (check, Constructor, template, value) => {
  if (!check) {
    throw new Constructor(format(template, [value]));
  }
};

export const expect2 = (check, Constructor, template, value1, value2) => {
  if (!check) {
    throw new Constructor(format(template, [value1, value2]));
  }
};

export const expect3 = (
  check,
  Constructor,
  template,
  value1,
  value2,
  value3,
) => {
  if (!check) {
    throw new Constructor(format(template, [value1, value2, value3]));
  }
};

export const expect4 = (
  check,
  Constructor,
  template,
  value1,
  value2,
  value3,
  value4,
) => {
  if (!check) {
    throw new Constructor(format(template, [value1, value2, value3, value4]));
  }
};

/* eslint-disable no-restricted-syntax */
export const expectDeadcode = (Constructor, template, ...values1) =>
  function (...values2) {
    throw new Constructor(format(template, concat(values1, [this], values2)));
  };
/* eslint-enable no-restricted-syntax */

/* eslint-disable no-restricted-syntax */
export const expectSuccess = (closure, Constructor, template, ...values1) =>
  function (...values2) {
    try {
      return apply(closure, this, values2);
    } catch (error) {
      throw new Constructor(
        format(template, concat(values1, [this], values2, [error])),
      );
    }
  };
/* eslint-enable no-restricted-syntax */

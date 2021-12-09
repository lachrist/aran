import {concat} from "array-lite";

const {
  JSON: {stringify},
  Reflect: {apply, getOwnPropertyDescriptor},
  Object: {
    prototype: {toString},
  },
  Error,
  String,
  String: {
    prototype: {substring, replace},
  },
  undefined,
} = globalThis;

const EMPTY_ARRAY = [];

const ONE_ARRAY = [1];

export const assert = (check, message) => {
  if (!check) {
    throw new Error(message);
  }
};

export const generateThrowError = (message) => () => {
  throw new Error(message);
};

export const inspect = (value) => {
  if (typeof value === "string") {
    return stringify(value);
  }
  if (
    typeof value === "function" ||
    (typeof value === "object" && value !== null)
  ) {
    return apply(toString, value, EMPTY_ARRAY);
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
        const {value: error_message} = descriptor;
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
      return assert(false, "invalid format marker");
    },
  ]);
  assert(index === values.length, "missing format marker");
  return message;
};

/* eslint-disable no-restricted-syntax */

export class AranError extends Error {}

export class SyntaxAranError extends AranError {}

export class EnclaveLimitationAranError extends AranError {}

export class InvalidOptionsAranError extends AranError {}

/* eslint-enable no-restricted-syntax  */

export const expect = (check, Constructor, template, values) => {
  if (!check) {
    throw new Constructor(format(template, values));
  }
};

export const expectSuccess = (
  closure,
  context,
  values1,
  Constructor,
  template,
  values2,
) => {
  try {
    return apply(closure, context, values1);
  } catch (error) {
    throw new Constructor(format(template, concat(values2, [error])));
  }
};

import { join, map, concat } from "array-lite";
import { assert } from "./assert.mjs";
import { partial_x } from "./closure.mjs";

const {
  Error,
  parseInt,
  String,
  String: {
    prototype: { substring, replace },
  },
  Array: { isArray },
  JSON: { stringify },
  Reflect: { apply },
  Object: { entries: toEntries },
  RegExp: {
    prototype: { test: testRegExp },
  },
} = globalThis;

const ONE_ARRAY = [1];

export const inspect = (value) => {
  if (typeof value === "string") {
    return stringify(value);
  } else if (typeof value === "function") {
    return "<function>";
  } else if (typeof value === "object" && value !== null) {
    return isArray(value) ? "<array>" : "<object>";
  } else {
    return String(value);
  }
};

/* eslint-disable no-use-before-define */

export const inspectEntryDeep = ([key, value], level) =>
  `${String(key)}:${inspectDeep(value, level)}`;

/* eslint-enable no-use-before-define */

export const inspectDeep = (value, level) => {
  if (typeof value === "object" && value !== null && level > 0) {
    if (isArray(value)) {
      return `[${join(map(value, partial_x(inspectDeep, level - 1)), ", ")}]`;
    } else {
      return `{ ${join(
        map(toEntries(value), partial_x(inspectEntryDeep, level - 1)),
        ", ",
      )} }`;
    }
  } else {
    return inspect(value);
  }
};

export const format = (template, values) => {
  let index = 0;
  const message = apply(replace, template, [
    /(%+)($|[^%])/gu,
    (_match, escape, marker) => {
      if (escape.length >= 2) {
        return `${apply(substring, escape, ONE_ARRAY)}${marker}`;
      } else {
        assert(index < values.length, "missing format value");
        const value = values[index];
        index += 1;
        if (marker === "s") {
          assert(typeof value === "string", "expected a string for format");
          return value;
        } else if (marker === "o") {
          return inspect(value);
        } else if (marker === "O") {
          return String(value);
        } else if (marker === "j") {
          return stringify(value);
        } else if (marker === "v") {
          return "";
        } else if (apply(testRegExp, /^[0-9]$/u, [marker])) {
          return inspectDeep(value, parseInt(marker));
        } else {
          throw new Error("invalid format marker");
        }
      }
    },
  ]);
  assert(index === values.length, "missing format marker");
  return message;
};

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

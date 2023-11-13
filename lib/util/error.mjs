/* eslint-disable local/no-impure */
/* eslint-disable local/strict-console */
/* eslint-disable local/no-function */
/* eslint-disable local/no-class */

const {
  Array: { isArray },
  String,
  console,
  console: { dir, log },
  Reflect: { apply },
  Error,
  TypeError,
  JSON: { stringify: stringifyJson },
} = globalThis;

/**
 * @type {(candidate: unknown) => string}
 */
const print = (candidate) => {
  if (typeof candidate === "string") {
    return stringifyJson(candidate);
  }
  if (typeof candidate === "function") {
    return "<function>";
  }
  if (typeof candidate === "object" && candidate !== null) {
    return isArray(candidate) ? "<array>" : "<object>";
  }
  return String(candidate);
};

export const AranTypeError = class AranTypeError extends TypeError {
  constructor(/** @type {string} */ message, /** @type {never} */ data) {
    apply(log, console, [message]);
    apply(dir, console, [data]);
    super(message);
    this.name = "AranTypeError";
  }
};

export const AranInputError = class AranInputError extends Error {
  constructor(
    /** @type {string} */ name,
    /** @type {string} */ template,
    /** @type {unknown} */ candidate,
  ) {
    super(`${name} should be ${template}, but got: ${print(candidate)}`);
    this.name = "AranInputError";
  }
};

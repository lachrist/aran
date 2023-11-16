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
export const print = (candidate) => {
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

export const AranTypeError = class extends TypeError {
  constructor(/** @type {string} */ message, /** @type {never} */ data) {
    apply(log, console, [message]);
    apply(dir, console, [data]);
    super(message);
    this.name = "AranTypeError";
  }
};

export const AranInputError = class extends Error {
  constructor(
    /** @type {string} */ path,
    /** @type {string} */ template,
    /** @type {unknown} */ candidate,
  ) {
    super(`${path} should be ${template}, but got: ${print(candidate)}`);
    this.name = "AranInputError";
  }
};

export const AranClashError = class AranClashError extends Error {
  constructor(/** @type {string} */ message) {
    super(message);
    // super(`External variable '${variable}' clashes with options.${name}`);
    this.name = "AranClashError";
  }
};

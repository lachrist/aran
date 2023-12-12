/* eslint-disable local/no-impure */
/* eslint-disable local/strict-console */
/* eslint-disable local/no-function */
/* eslint-disable local/no-class */

const {
  Array: { isArray },
  String,
  SyntaxError,
  JSON: { stringify: stringifyJson },
  console,
  console: { dir, log },
  Reflect: { apply },
  Error,
  TypeError,
} = globalThis;

export const AranError = class extends Error {
  constructor(/** @type {string} */ message, /** @type {unknown} */ data) {
    apply(log, console, [message]);
    apply(dir, console, [data]);
    super(message);
    this.name = "AranError";
    this._aran_bug = true;
  }
};

export const AranTypeError = class extends TypeError {
  constructor(/** @type {string} */ message, /** @type {never} */ data) {
    apply(log, console, [message]);
    apply(dir, console, [data]);
    super(message);
    this.name = "AranTypeError";
    this._aran_bug = true;
  }
};

/**
 * @type {(anything: unknown) => string}
 */
const print = (anything) => {
  if (typeof anything === "string") {
    return stringifyJson(anything);
  }
  if (typeof anything === "function") {
    return "<function>";
  }
  if (typeof anything === "object" && anything !== null) {
    return isArray(anything) ? "<array>" : "<object>";
  }
  return String(anything);
};

export const AranSyntaxError = class extends SyntaxError {
  constructor(/** @type {string} */ message) {
    super(message);
    this._aran_bug = false;
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
    this._aran_bug = false;
  }
};

export const AranClashError = class AranClashError extends Error {
  constructor(
    /** @type {estree.Variable} */ variable,
    /** @type {estree.Variable}*/ escape,
  ) {
    super(`External variable '${variable}' clashes escape prefix '${escape}'`);
    this.name = "AranClashError";
    this._aran_bug = false;
  }
};

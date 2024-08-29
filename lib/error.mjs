/* eslint-disable local/no-impure */
/* eslint-disable local/strict-console */
/* eslint-disable local/no-function */
/* eslint-disable local/no-class */

import { formatWarning } from "./warning.mjs";
import { join } from "./util/index.mjs";

const {
  Array: { isArray },
  String,
  SyntaxError,
  JSON: { stringify: stringifyJson },
  console,
  console: { dir, log },
  Reflect: { apply },
  Error,
} = globalThis;

/**
 * @type {(anything: unknown) => string}
 */
export const print = (anything) => {
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

export const AranError = class extends Error {
  constructor(/** @type {string} */ message, /** @type {unknown} */ data) {
    apply(log, console, [message]);
    apply(dir, console, [data, { depth: 5 }]);
    super(message);
    this.name = "AranError";
    this._aran_bug = true;
  }
};

export const AranTypeError = class extends AranError {
  constructor(/** @type {never} */ data) {
    const message = `Typescript loophole: ${print(data)}`;
    super(message, data);
    this.name = "AranTypeError";
    this._aran_bug = true;
  }
};

export const AranSyntaxError = class extends SyntaxError {
  constructor(/** @type {string} */ message) {
    super(message);
    this._aran_bug = false;
  }
};

export const AranInputError = class extends Error {
  constructor(/** @type {string} */ message) {
    super(message);
    this.name = "AranInputError";
    this._aran_bug = false;
  }
};

export const AranPoincutError = class extends Error {
  constructor(
    /** @type { "apply@around" | "construct@around" | "eval@before"} */ name,
    /** @type {import("./estree").Variable[]} */ conflicts,
  ) {
    super(
      `${name} can only be triggered once but got triggered by ${join(
        conflicts,
        ", ",
      )}`,
    );
    this.name = "AranPoincutError";
    this._aran_bug = false;
  }
};

export const AranWarningError = class extends Error {
  constructor(/** @type {import("./warning").Warning} */ warning) {
    super(formatWarning(warning));
    this.name = "AranWarningError";
    this._aran_bug = false;
  }
};

export const AranClashError = class AranClashError extends Error {
  constructor(/** @type {string} */ message) {
    super(message);
    this.name = "AranClashError";
    this._aran_bug = false;
  }
};

/* eslint-disable local/strict-console */
/* eslint-disable local/no-function */
/* eslint-disable local/no-class */

const { console, Error } = globalThis;

export const AranTypeError = class AranTypeError extends Error {
  constructor(/** @type {never} */ data) {
    console.log("AranTypeError");
    console.dir(data);
    super("aran typeerror");
    this.name = "AranTestError";
  }
};

export const AranTestError = class AranTestError extends Error {
  constructor(/** @type {string} */ message) {
    super(message);
    this.name = "AranTestError";
  }
};

export const AranExecError = class AranError extends Error {
  constructor(/** @type {string} */ message, /** @type {unknown} */ data) {
    console.log(`AranExecError >> ${message}`);
    console.dir(data);
    super(message);
  }
};

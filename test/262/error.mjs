/* eslint-disable local/strict-console */
/* eslint-disable local/no-function */
/* eslint-disable local/no-class */

import { inspectErrorMessage } from "./error-serial.mjs";

const { console, Error } = globalThis;

export const AranTypeError = class extends Error {
  constructor(/** @type {never} */ data) {
    console.log("AranTypeError");
    console.dir(data);
    super("aran typeerror");
    this.name = "AranTestError";
  }
};

export const AranExecError = class extends Error {
  constructor(/** @type {string} */ message, /** @type {unknown} */ data) {
    console.log(`AranExecError >> ${message}`);
    console.dir(data);
    super(message);
    this.name = "AranExecError";
  }
};

export const AranNegativeError = class extends Error {
  constructor(/** @type {string} */ cause) {
    super(cause);
    this.name = "AranNegativeError";
  }
};

export const AranTestError = class extends Error {
  constructor(/** @type {unknown} */ error) {
    super(inspectErrorMessage(error), { cause: error });
    this.name = "AranTestError";
  }
};

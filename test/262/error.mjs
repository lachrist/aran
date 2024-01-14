/* eslint-disable local/strict-console */
/* eslint-disable local/no-function */
/* eslint-disable local/no-class */

const { console, Error } = globalThis;

export const AranTypeError = class AranTypeError extends Error {
  /**
   * @param {never} data
   */
  constructor(/** @type {never} */ data) {
    console.log("AranTypeError");
    console.dir(data);
    super("aran-type-error");
  }
};

export const AranError = class AranError extends Error {
  /**
   * @param {string} message
   */
  constructor(message) {
    console.log(`AranError >> ${message}`);
    super(message);
  }
};

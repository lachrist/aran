/* eslint-disable local/strict-console */
/* eslint-disable local/no-function */
/* eslint-disable local/no-class */

const { console, Error } = globalThis;

export const AranTypeError = class AranTypeError extends Error {
  /**
   * @param {string} message
   * @param {never} data
   */
  constructor(message, data) {
    console.log(`AranTypeError >> ${message}`);
    console.dir(data);
    super(message);
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

/* eslint-disable local/no-function */
/* eslint-disable local/no-class */

const { Error } = globalThis;

export const StaticError = class StaticError extends Error {
  /**
   * @param {string} message
   * @param {never} data
   */
  constructor(message, data) {
    super(message);
    this.data = data;
  }
};

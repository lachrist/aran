/* eslint-disable no-restricted-syntax */

const { Error } = globalThis;

export class AranError extends Error {
  constructor(/** @type {string} */ message) {
    super(message);
    this.name = "AranError";
  }
}

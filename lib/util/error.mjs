/* eslint-disable no-restricted-syntax */

const {
  console,
  console: { dir, log },
  Reflect: { apply },
  Error,
} = globalThis;

export class StaticError extends Error {
  constructor(/** @type {string} */ message, /** @type {never} */ never) {
    apply(log, console, [message]);
    apply(dir, console, [never]);
    super(message);
    this.name = "StaticError";
  }
}

export class DynamicError extends Error {
  constructor(/** @type {string} */ message, /** @type {unknown} */ unknown) {
    apply(log, console, [message]);
    apply(dir, console, [unknown]);
    super(message);
    this.name = "DynamicError";
  }
}

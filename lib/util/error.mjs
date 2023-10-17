/* eslint-disable local/no-impure */
/* eslint-disable local/strict-console */
/* eslint-disable local/no-function */
/* eslint-disable local/no-class */

const {
  console,
  console: { dir, log },
  Reflect: { apply },
  TypeError,
} = globalThis;

export const AranTypeError = class AranTypeError extends TypeError {
  constructor(/** @type {string} */ message, /** @type {never} */ data) {
    apply(log, console, [message]);
    apply(dir, console, [data]);
    super(message);
    this.name = "AranTypeError";
  }
};

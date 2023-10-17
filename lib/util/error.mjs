/* eslint-disable local/no-impure */
/* eslint-disable local/strict-console */
/* eslint-disable local/no-function */
/* eslint-disable local/no-class */

const {
  console,
  console: { dir, log },
  Reflect: { apply },
  Error,
} = globalThis;

export const StaticError = class StaticError extends Error {
  constructor(/** @type {string} */ message, /** @type {never} */ data) {
    apply(log, console, [message]);
    apply(dir, console, [data]);
    super(message);
    this.name = "StaticError";
  }
};

// export const DynamicError = class DynamicError extends Error {
//   constructor(/** @type {string} */ message, /** @type {unknown} */ data) {
//     apply(log, console, [message]);
//     apply(dir, console, [data]);
//     super(message);
//     this.name = "DynamicError";
//   }
// };

// export const AssertionError = class AssertionError extends Error {
//   constructor(/** @type {string} */ message) {
//     super(message);
//     this.name = "AssertError";
//   }
// };

// /** @type {(check: boolean, message: string) => void} */
// export const assert = (check, message) => {
//   if (!check) {
//     throw new AssertionError(message);
//   }
// };

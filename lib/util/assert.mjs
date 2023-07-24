const { Error } = globalThis;

/* eslint-disable no-restricted-syntax */
class AssertionError extends Error {
  get name() {
    return "AssertionError";
  }
}
/* eslint-enable no-restricted-syntax */

/** @type {(check: boolean, message: string) => void} */
export const assert = (check, message) => {
  if (!check) {
    throw new AssertionError(message);
  }
};

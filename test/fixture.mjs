/* eslint-disable no-console */
/* eslint-disable import/no-nodejs-modules */

import { AssertionError } from "node:assert";

export {
  fail as assertUnreachable,
  ok as assert,
  deepEqual as assertEqual,
  notDeepEqual as assertNotEqual,
  throws as assertThrow,
  match as assertMatch,
} from "node:assert/strict";

const {
  undefined,
  Error,
  Reflect: { getOwnPropertyDescriptor },
} = globalThis;

Error.stackTraceLimit = 1 / 0;

/** @type {(maybe: string | null) => void} */
export const assertSuccess = (maybe) => {
  if (maybe !== null) {
    // Sometimes large message are truncated...
    // Tried stdout.write and writeSync(1, ...)
    // Nothing works...
    console.log(maybe);
    throw new Error("failure");
  }
};

/** @type {(maybe: string | null) => void} */
export const assertFailure = (maybe) => {
  if (maybe === null) {
    throw new Error("missing failure");
  }
};

/** @type {(obj: unknown, keys: PropertyKey[]) => unknown} */
export const drill = (obj, keys) => {
  const { length } = keys;
  for (let index = 0; index < length; index += 1) {
    if (typeof obj !== "object" || obj === null) {
      throw new AssertionError({
        message: "expected an object",
        actual: obj,
      });
    }
    const key = keys[index];
    const descriptor = getOwnPropertyDescriptor(obj, key);
    if (descriptor === undefined) {
      throw new AssertionError({
        message: "missing property",
        actual: obj,
        expected: key,
      });
    }
    obj = descriptor.value;
  }
  return obj;
};

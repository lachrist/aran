/* eslint-disable no-nodejs-modules */
import { strict as Assert } from "assert";
import { stdout } from "process";
/* eslint-enable no-nodejs-modules */

const { Error, Reflect: { defineProperty} } = globalThis;

defineProperty(
  globalThis,
  "ARAN_DEBUG",
  {
    __proto__: null,
    configurable: false,
    enumerable: false,
    writable: false,
    value: null,
  },
);

Error.stackTraceLimit = 1 / 0;

export const {
  fail: assertUnreachable,
  ok: assert,
  throws: assertThrow,
  equal: assertEqual,
  deepEqual: assertDeepEqual,
  match: assertMatch,
  notEqual: assertNotEqual,
  notDeepEqual: assertNotDeepEqual,
} = Assert;

export const assertSuccess = (maybe) => {
  if (maybe !== null) {
    // Sometimes large message are truncated...
    // Tried stdout.write and writeSync(1, ...)
    // Nothing works...
    console.log(maybe);
    throw new Error("failure");
  }
};

export const assertFailure = (maybe) => {
  if (maybe === null) {
    throw new Error("missing failure");
  }
};

export const generateAssertUnreachable = (message) => () => {
  assertUnreachable(message);
};

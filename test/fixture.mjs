/* eslint-disable no-console */
/* eslint-disable import/no-nodejs-modules */

export {
  fail as assertUnreachable,
  ok as assert,
  deepEqual as assertEqual,
  notDeepEqual as assertNotEqual,
  throws as assertThrow,
  match as assertMatch,
} from "node:assert/strict";

const { Error } = globalThis;

Error.stackTraceLimit = 1 / 0;

/** @type {(maybe: string | null) => void} */
export const assertSuccess = (maybe) => {
  if (maybe !== null) {
    // Sometimes large message are truncated...
    // Tried stdout.write and writeSync(1, ...)
    // Nothing works...
    // @ts-ignore
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

/* eslint-disable no-nodejs-modules */
import { strict as Assert } from "assert";
/* eslint-enable no-nodejs-modules */

const { Error } = globalThis;

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

export const assertSuccess = (either) => {
  if (either !== null) {
    throw new Error(either);
  }
};

export const assertFailure = (either) => {
  if (either === null) {
    throw new Error("missing failure");
  }
};

export const generateAssertUnreachable = (message) => () => {
  assertUnreachable(message);
};

export const parseEstree = (code) => {

};

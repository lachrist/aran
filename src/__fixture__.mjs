
/* eslint-disable no-nodejs-modules */
import {strict as Assert} from "assert";
/* eslint-enable no-nodejs-modules */

const {Error} = globalThis;

Error.stackTraceLimit = 1/0;

export const {
  fail: assertUnreachable,
  ok: assert,
  throws: assertThrow,
  equal: assertEqual,
  deepEqual: assertDeepEqual,
  match: assertMatch,
} = Assert;

export const generateAssertUnreachable = (message) => () => {
  assertUnreachable(message);
};

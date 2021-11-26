
/* eslint-disable no-nodejs-modules */
import {strict as Assert} from "assert";
/* eslint-enable no-nodejs-modules */

export const {
  fail: assertUnreachable,
  ok: assert,
  throws: assertThrow,
  equal: assertEqual,
  deepEqual: assertDeepEqual,
} = Assert;

export const generateAssertUnreachable = (message) => () => {
  assertUnreachable(message);
};

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
  Infinity,
  undefined,
  Error,
  Reflect: { getOwnPropertyDescriptor },
} = globalThis;

Error.stackTraceLimit = Infinity;

/** @type {(maybe: unknown) => void} */
export const assertSuccess = (maybe) => {
  if (maybe != null) {
    // Sometimes large message are truncated...
    // Tried stdout.write and writeSync(1, ...)
    // Nothing works...
    console.dir(maybe, { depth: 10 });
    throw new Error("failure");
  }
};

/** @type {(maybe: unknown) => void} */
export const assertFailure = (maybe) => {
  if (maybe == null) {
    throw new Error("missing failure");
  }
};

/** @type {(obj: unknown, keys: PropertyKey[]) => unknown} */
export const drill = (object, keys) => {
  let current = object;
  const { length } = keys;
  for (let index = 0; index < length; index += 1) {
    if (typeof current !== "object" || current === null) {
      throw new AssertionError({
        message: "expected an object",
        actual: current,
      });
    }
    const key = keys[index];
    const descriptor = getOwnPropertyDescriptor(current, key);
    if (descriptor === undefined) {
      throw new AssertionError({
        message: "missing property",
        actual: current,
        expected: key,
      });
    }
    current = descriptor.value;
  }
  return current;
};

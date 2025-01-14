import { MISSING_ERROR_MESSAGE } from "./error-serial.mjs";
import { AranTypeError } from "./error.mjs";

const {
  Array: { isArray },
} = globalThis;

/**
 * @type {(
 *   data: import("./json").Json,
 * ) => data is import("./result").CompactResultEntry}
 */
export const isCompactResult = (data) =>
  isArray(data) &&
  data.length > 1 &&
  (data[1] === "include" || data[1] === "exclude");

/**
 * @type {(
 *   execution: import("./result").Execution,
 * ) => import("./result").CompactExecution}
 */
const packExecution = ({ directive, actual, expect, time }) => [
  directive,
  actual === null ? null : actual.name,
  time.user,
  time.system,
  ...expect,
];

/**
 * @type {(
 *   execution: import("./result").CompactExecution,
 * ) => import("./result").Execution}
 */
const unpackExecution = ([directive, actual, time1, time2, ...expect]) => ({
  directive,
  actual:
    actual === null
      ? null
      : { name: actual, message: MISSING_ERROR_MESSAGE, stack: null },
  expect,
  time: { user: time1, system: time2 },
});

/**
 * @type {(
 *   result: import("./result").ResultEntry,
 * ) => import("./result").CompactResultEntry}
 */
export const packResultEntry = ([key, val]) => {
  if (val.type === "include") {
    return [key, "in", ...val.data.map(packExecution)];
  } else if (val.type === "exclude") {
    return [key, "ex", ...val.data];
  } else {
    throw new AranTypeError(val);
  }
};

/**
 * @type {(
 *   result: import("./result").CompactResultEntry,
 * ) => import("./result").ResultEntry}
 */
export const unpackResultEntry = (res) => {
  if (res[1] === "ex") {
    const [path, _type, ...data] = res;
    return [path, { type: "exclude", data }];
  } else if (res[1] === "in") {
    const [path, _type, ...data] = res;
    return [path, { type: "include", data: data.map(unpackExecution) }];
  } else {
    throw new AranTypeError(res[1]);
  }
};

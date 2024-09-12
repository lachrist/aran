import { isErrorSerial } from "./error-serial.mjs";
import { hasOwnJson } from "./json.mjs";

const {
  Array: { isArray },
} = globalThis;

/**
 * @type {(
 *   data: import("./json").Json,
 * ) => data is string[]}
 */
const isStringArray = (data) => {
  if (isArray(data)) {
    for (const value of data) {
      if (typeof value !== "string") {
        return false;
      }
    }
    return true;
  } else {
    return false;
  }
};

/**
 * @type {(
 *   result: import("./result").Result,
 * ) => string}
 */
export const getResultPath = ({ path }) => path;

/**
 * @type {(
 *   data: import("./json").Json,
 * ) => data is import("./result").Result}
 */
export const isResult = (data) => {
  if (
    typeof data === "object" &&
    data !== null &&
    !isArray(data) &&
    hasOwnJson(data, "type")
  ) {
    if (data.type === "exclude") {
      return (
        hasOwnJson(data, "path") &&
        typeof data.path === "string" &&
        hasOwnJson(data, "tags") &&
        isStringArray(data.tags)
      );
    } else if (data.type === "include") {
      return (
        hasOwnJson(data, "path") &&
        typeof data.path === "string" &&
        hasOwnJson(data, "expect") &&
        isStringArray(data.expect) &&
        hasOwnJson(data, "actual") &&
        (data.actual === null || isErrorSerial(data.actual))
      );
    } else {
      return false;
    }
  } else {
    return false;
  }
};

/**
 * @type {(
 *   data: import("./json").Json,
 * ) => data is import("./result").Result[]}
 */
export const isResultArray = (data) => isArray(data) && data.every(isResult);

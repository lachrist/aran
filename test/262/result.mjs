import { MISSING_ERROR_MESSAGE } from "./util/index.mjs";
import { AranTypeError } from "./error.mjs";

const {
  Array: { isArray },
} = globalThis;

/**
 * @type {(
 *   data: import("../../lib").Json
 * ) => data is import("./result").TestSpecifier}
 */
export const isTestSpecifier = (data) =>
  typeof data === "string" &&
  (data.endsWith("@none") || data.endsWith("@use-strict"));

/**
 * @type {(
 *   data: import("../../lib").Json
 * ) => data is import("./result").CompactResult}
 */
export const isCompactResult = (data) =>
  isArray(data) && data.length > 0 && (data[0] === "in" || data[0] === "ex");

/**
 * @type {(
 *   path: import("./fetch").TestPath,
 *   directive: import("./test-case").Directive
 * ) => import("./result").TestSpecifier}
 */
export const toTestSpecifier = (path, directive) => `${path}@${directive}`;

/**
 * @type {(
 *   result: import("./result").Result,
 * ) => import("./result").CompactResult}
 */
export const packResult = (result) => {
  switch (result.type) {
    case "exclude": {
      return ["ex", ...result.reasons];
    }
    case "include": {
      const { actual, expect, time } = result;
      return [
        "in",
        actual === null ? null : actual.name,
        time.user,
        time.system,
        ...expect,
      ];
    }
    default: {
      throw new AranTypeError(result);
    }
  }
};

/**
 * @type {(
 *   result: import("./result").CompactResult,
 * ) => import("./result").Result}
 */
export const unpackResult = (result) => {
  switch (result[0]) {
    case "ex": {
      const [_type, ...exclusion] = result;
      return {
        type: "exclude",
        reasons: exclusion,
      };
    }
    case "in": {
      const [_type, actual, time1, time2, ...expect] = result;
      return {
        type: "include",
        actual:
          actual === null
            ? null
            : { name: actual, message: MISSING_ERROR_MESSAGE, stack: null },
        time: { user: time1, system: time2 },
        expect,
      };
    }
    default: {
      throw new AranTypeError(result[0]);
    }
  }
};

/**
 * @type {(
 *   result: import("./result").IncludeResult,
 * ) => (
 *   | "false-positive"
 *   | "false-negative"
 *   | "true-positive"
 *   | "true-negative"
 * )}
 */
export const getResultStatus = ({ actual, expect }) =>
  actual === null
    ? expect.length === 0
      ? "true-positive"
      : "false-negative"
    : expect.length === 0
      ? "false-negative"
      : "true-negative";

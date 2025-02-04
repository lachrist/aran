import { MISSING_ERROR_MESSAGE } from "./util/index.mjs";
import { AranExecError, AranTypeError } from "./error.mjs";

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
 *   data: import("../../lib").Json
 * ) => data is import("./result").CompactResultEntry}
 */
export const isCompactResultEntry = (data) =>
  isArray(data) &&
  data.length === 2 &&
  isTestSpecifier(data[0]) &&
  isCompactResult(data[1]);

/**
 * @type {(
 *   path: import("./fetch").TestPath,
 *   directive: import("./test-case").Directive
 * ) => import("./result").TestSpecifier}
 */
export const toTestSpecifier = (path, directive) => `${path}@${directive}`;

/**
 * @type {(
 *   specifier: import("./result").TestSpecifier,
 * ) => {
 *   path: import("./fetch").TestPath,
 *   directive: import("./test-case").Directive,
 * }}
 */
export const parseTestSpecifier = (specifier) => {
  const parts = specifier.split("@");
  if (parts.length !== 2) {
    throw new AranExecError("Invalid test specifier", { specifier });
  }
  const [path, directive] = parts;
  if (directive !== "none" && directive !== "use-strict") {
    throw new AranExecError("Invalid test directive", {
      specifier,
      path,
      directive,
    });
  }
  return {
    // eslint-disable-next-line object-shorthand
    path: /** @type {import("./fetch").TestPath} */ (path),
    directive,
  };
};

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

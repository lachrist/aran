import { MISSING_ERROR_MESSAGE } from "./error-serial.mjs";
import { AranExecError, AranTypeError } from "./error.mjs";

const {
  JSON,
  Array: { isArray },
} = globalThis;

/**
 * @type {(
 *   line: string,
 * ) => import("./result").CompactResultEntry}
 */
export const parseCompactResultEntry = (line) => {
  const data = JSON.parse(line);
  if (
    !isArray(data) ||
    data.length < 2 ||
    (data[1] !== "in" && data[1] !== "ex")
  ) {
    throw new AranExecError("invalid compact result entry", { line, data });
  }
  return /** @type {any} */ (data);
};

/**
 * @type {(
 *   path: import("./fetch").MainPath,
 *   directive: import("./test-case").Directive
 * ) => import("./result").TestSpecifier}
 */
export const toTestSpecifier = (path, directive) =>
  /** @type {import("./result").TestSpecifier} */ (`${path}@${directive}`);

/**
 * @type {(
 *   data: unknown,
 * ) => data is import("./result").CompactResultEntry}
 */
export const isCompactResultEntry = (data) =>
  isArray(data) && data.length > 1 && (data[1] === "in" || data[1] === "ex");

/**
 * @type {(
 *   result: import("./result").Result,
 * ) => result is import("./result").ExcludeResult}
 */
export const isExcludeResult = /** @type {any} */ (isArray);

/**
 * @type {(
 *   data: import("./result").CompactResultEntry,
 * ) => boolean}
 */
export const isFailureCompactResultEntry = (result) =>
  result[1] === "ex" || result[2] !== null;

/**
 * @type {(
 *   result: import("./result").ResultEntry,
 * ) => import("./result").CompactResultEntry}
 */
export const packResultEntry = ([specifier, result]) => {
  if (isExcludeResult(result)) {
    return [specifier, "ex", ...result];
  } else {
    const { actual, expect, time } = result;
    return [
      specifier,
      "in",
      actual === null ? null : actual.name,
      time.user,
      time.system,
      ...expect,
    ];
  }
};

/**
 * @type {(
 *   result: import("./result").CompactResultEntry,
 * ) => import("./result").ResultEntry}
 */
export const unpackResultEntry = (res) => {
  if (res[1] === "ex") {
    const [specifier, _type, ...exclusion] = res;
    return [specifier, exclusion];
  } else if (res[1] === "in") {
    const [specifier, _type, actual, time1, time2, ...expect] = res;
    return [
      specifier,
      {
        actual:
          actual === null
            ? null
            : { name: actual, message: MISSING_ERROR_MESSAGE, stack: null },
        time: { user: time1, system: time2 },
        expect,
      },
    ];
  } else {
    throw new AranTypeError(res[1]);
  }
};

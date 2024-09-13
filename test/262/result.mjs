import { AranTypeError } from "./error.mjs";

const {
  Array: { isArray },
} = globalThis;

/**
 * @type {(
 *   data: import("./json").Json,
 * ) => data is import("./result").CompactResult}
 */
export const isCompactResult = (data) =>
  isArray(data) && data.length === 5 && typeof data[0] === "string";

/**
 * @type {(
 *   result: import("./result").Result,
 * ) => import("./result").CompactResult}
 */
export const packResult = (result) => {
  if (result.type === "include") {
    return [
      result.path,
      [],
      result.expect,
      result.actual,
      [
        result.time.total.user,
        result.time.total.system,
        result.time.instrument.user,
        result.time.instrument.system,
      ],
    ];
  } else if (result.type === "exclude") {
    return [result.path, result.exclusion, null, null, null];
  } else {
    throw new AranTypeError(result);
  }
};

/**
 * @type {(
 *   result: import("./result").CompactResult,
 * ) => import("./result").Result}
 */
export const unpackResult = (result) => {
  if (result[4] !== null) {
    return {
      type: "include",
      path: result[0],
      exclusion: [],
      expect: result[2],
      actual: result[3],
      time: {
        total: {
          user: result[4][0],
          system: result[4][1],
        },
        instrument: {
          user: result[4][2],
          system: result[4][3],
        },
      },
    };
  } else {
    return {
      type: "exclude",
      path: result[0],
      exclusion: result[1],
      expect: null,
      actual: null,
      time: null,
    };
  }
};

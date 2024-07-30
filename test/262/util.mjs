import { AranTypeError } from "./error.mjs";

const { Error, String, Map, undefined } = globalThis;

/** @type {(value: unknown) => string} */
export const show = (value) => {
  if (typeof value === "object" && value !== null) {
    return "[object]";
  } else if (typeof value === "function") {
    return "[function]";
  } else {
    return String(value);
  }
};

/**
 * @type {<X>(
 *   results: PromiseSettledResult<X>[],
 * ) => X[]}
 */
export const unwrapSettleArray = (results) => {
  const values = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      values.push(result.value);
    } else if (result.status === "rejected") {
      throw result.reason;
    } else {
      throw new AranTypeError(result);
    }
  }
  return values;
};

/**
 * @type {<X, Y>(
 *   x: X,
 *   y: Y,
 * ) => [X, Y]}
 */
export const pairup = (x, y) => [x, y];

/**
 * @type {<X>(
 *   value: X | null
 * ) => X}
 */
export const fromNullable = (value) => {
  if (value === null) {
    throw new Error("unexpected null");
  } else {
    return value;
  }
};

/**
 * @template X
 * @template Y
 * @param {Map<X, Y[]>} map
 * @return {Map<Y, X[]>}
 */
export const inverse = (map) => {
  /** @type {Map<Y, X[]>} */
  const inverse = new Map();
  for (const [key, values] of map.entries()) {
    for (const value of values) {
      const keys = inverse.get(value);
      if (keys === undefined) {
        inverse.set(value, [key]);
      } else {
        keys.push(key);
      }
    }
  }
  return inverse;
};

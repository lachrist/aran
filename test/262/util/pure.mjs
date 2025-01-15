const { String } = globalThis;

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
 *   array: X[],
 * ) => array is [X, ...X[]]}
 */
export const isNotEmptyArray = (array) => array.length > 0;

/**
 * @type {(
 *   string: string,
 * ) => string}
 */
export const trimString = (string) => string.trim();

/**
 * @type {<X, Y>(
 *  pair: [X, Y]
 * ) => X}
 */
export const getFirst = ([x, _y]) => x;

/**
 * @type {(
 *   string: string,
 * ) => boolean}
 */
export const isNotEmptyString = (string) => string.length > 0;

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
 * @type {(
 *   string: string,
 * ) => string}
 */
export const trimString = (string) => string.trim();

/**
 * @type {(
 *   string: string,
 * ) => boolean}
 */
export const isNotEmptyString = (string) => string.length > 0;

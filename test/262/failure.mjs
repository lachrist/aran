const {
  Error,
  JSON,
  Array: { isArray },
} = globalThis;

/**
 * @type {(
 *   data: unknown
 * ) => data is string}
 */
const isString = (data) => typeof data === "string";

/**
 * @type {<X>(
 *   data: unknown,
 *   predicate: (data: unknown) => data is X,
 * ) => data is X[]}
 */
const isArrayOf = (data, predicate) => isArray(data) && data.every(predicate);

/**
 * @type {(
 *   data: unknown
 * ) => data is [string, string[]]}
 */
const isFailure = (data) =>
  isArray(data) &&
  data.length === 2 &&
  isString(data[0]) &&
  isArray(data[1]) &&
  data[1].every(isString);

/**
 * @type {(
 *   content: string,
 * ) => [
 *   string,
 *   string[],
 * ][]}
 */
export const parseFailure = (content) => {
  const data = JSON.parse(content);
  if (isArrayOf(data, isFailure)) {
    return data;
  } else {
    throw new Error("Invalid failure format");
  }
};

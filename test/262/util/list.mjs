/**
 * @type {(
 *   string: string,
 * ) => boolean}
 */
const isNotEmptyString = (string) => string !== "" && !string.startsWith("//");

/**
 * @type {(
 *   string: string,
 * ) => string}
 */
const trimString = (string) => string.trim();

/**
 * @type {(
 *   content: string,
 * ) => string[]}
 */
export const parseList = (content) =>
  content.split("\n").map(trimString).filter(isNotEmptyString);

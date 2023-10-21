import { inverse } from "./util.mjs";

const { Array } = globalThis;

/** @type {<X, Y>(entry1: [X, Y[]], entry2: [X, Y[]]) => number} */
const sortArrayEntry = ([_key1, values1], [_key2, values2]) =>
  values2.length - values1.length;

/** @type {<X, Y>(entry: [X, Y[]]) => string} */
const printArrayEntry = ([key, values]) => `${key}: ${values.length}`;

/** @type {<X, Y>(entry: [X, Y[]]) => boolean} */
const isArrayEntryEmpty = ([_key, values]) => values.length === 0;

/** @type {<X, Y>(entry: [X, Y[]]) => X} */
const getArrayEntryFirst = ([first, _values]) => first;

/**
 * @type {(
 *   failures: Map<string, string[]>,
 *   tagResult: (result: test262.Result) => string[],
 * ) => string}
 */
export const report = (failures) => {
  const remainder = Array.from(failures.entries())
    .filter(isArrayEntryEmpty)
    .map(getArrayEntryFirst);
  return [
    remainder.join("\n"),
    "",
    `Total failures count: ${failures.size}`,
    "",
    Array.from(inverse(failures).entries())
      .sort(sortArrayEntry)
      .map(printArrayEntry)
      .join("\n"),
    "",
    `Remaining: ${remainder.length}`,
  ].join("\n");
};

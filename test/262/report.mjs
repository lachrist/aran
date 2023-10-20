import { isFailure, parseResultDump, printResult } from "./result.mjs";

const { Map, Array } = globalThis;

/** @type {(entry1: [string, number], entry2: [string, number]) => number} */
const sortNumberEntry = ([_key1, val1], [_key2, val2]) => val2 - val1;

/** @type {<X, Y>(entry: [X, Y]) => string} */
const printEntry = ([key, val]) => `${key}: ${val}`;

/**
 * @type {(
 *   dump: string,
 *   tagResult: (result: test262.Result) => string[],
 * ) => string}
 */
export const report = (dump, tagResult) => {
  const failures = parseResultDump(dump).filter(isFailure);
  /** @type {Map<string, number>} */
  const tagging = new Map();
  /** @type {test262.Result[]} */
  const remainder = [];
  for (const failure of failures) {
    const tags = tagResult(failure);
    if (tags.length === 0) {
      remainder.push(failure);
    }
    for (const tag of tags) {
      tagging.set(tag, (tagging.get(tag) ?? 0) + 1);
    }
  }
  return [
    remainder.map(printResult).join("\n"),
    "",
    `Total failures count: ${failures.length}`,
    "",
    Array.from(tagging.entries())
      .sort(sortNumberEntry)
      .map(printEntry)
      .join("\n"),
    "",
    `Remaining: ${remainder.length}`,
  ].join("\n");
};

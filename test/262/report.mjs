import { isFailure, listFeature, parseResultDump } from "./result.mjs";

const { Map, Array } = globalThis;

/** @type {(error: test262.Error) => string} */
const printError = (error) => {
  let print = `  ${error.type}`;
  if ("feature" in error) {
    print += ` >> ${error.feature}`;
  }
  if ("name" in error) {
    print += ` >> ${error.name}`;
  }
  if ("message" in error) {
    print += ` >> ${error.message}`;
  }
  return `${print}\n`;
};

/** @type {(feature: string[]) => string} */
const printFeatureArray = (features) =>
  features.length === 0 ? "" : `  ${features.join(", ")}\n`;

/** @type {(result: test262.Result) => string} */
const printResult = ({ target, features, errors }) =>
  `test262/${target}\n${printFeatureArray(features)}${errors
    .map(printError)
    .join("")}`;

/** @type {(entry1: [string, number], entry2: [string, number]) => number} */
const sortFeatureEntry = ([_feature1, count1], [_feature2, count2]) =>
  count2 - count1;

/** @type {<X, Y>(entry: [X, Y]) => string} */
const printEntry = ([key, val]) => `${key}: ${val}`;

/**
 * @type {<X>(
 *   array: X[],
 *   predicate: (item: X) => boolean,
 * ) => number}
 */
const count = (array, predicate) => {
  let counter = 0;
  for (const item of array) {
    if (predicate(item)) {
      counter += 1;
    }
  }
  return counter;
};

/**
 * @type {(
 *   dump: string,
 *   filters: [string, (result: test262.Result) => boolean][],
 * ) => string}
 */
export const report = (dump, filters) => {
  const failures = parseResultDump(dump).filter(isFailure);
  const remaining = failures.filter(
    (result) => !filters.some(([, predicate]) => predicate(result)),
  );
  /** @type {Map<string, number>} */
  const features = new Map();
  for (const feature of failures.flatMap(listFeature)) {
    features.set(feature, (features.get(feature) ?? 0) + 1);
  }
  return [
    "\n=== Remaining ===\n",
    remaining.map(printResult).join("\n"),
    "\n=== Features ===\n",
    Array.from(features.entries())
      .sort(sortFeatureEntry)
      .map(printEntry)
      .join("\n"),
    "\n=== Accounting ===\n",
    /** @type {[string, number][]} */
    ([
      ["Failures", failures.length],
      ...filters.map(([name, predicate]) => [name, count(failures, predicate)]),
      ["Remaining", remaining.length],
    ])
      .map(printEntry)
      .join("\n"),
  ].join("\n");
};

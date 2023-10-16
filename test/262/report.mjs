import { listFeature, parseResultDump } from "./result.mjs";

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
  `${target}\n${printFeatureArray(features)}${errors.map(printError).join("")}`;

/** @type {(entry1: [string, number], entry2: [string, number]) => number} */
const sortFeatureEntry = ([_feature1, count1], [_feature2, count2]) =>
  count2 - count1;

/** @type {<X, Y>(entry: [X, Y]) => string} */
const printEntry = ([key, val]) => `${key}: ${val}`;

/**
 * @type {(
 *   dump: string,
 *   filters: [string, (result: test262.Result) => boolean][],
 * ) => string}
 */
export const report = (dump, filters) => {
  let results = parseResultDump(dump);
  /** @type {[string, number][]} */
  const totals = [["Total", results.length]];
  for (const [name, predicate] of filters) {
    results = results.filter(predicate);
    totals.push([name, results.length]);
  }
  /** @type {Map<string, number>} */
  const features = new Map();
  for (const feature of results.flatMap(listFeature)) {
    features.set(feature, (features.get(feature) ?? 0) + 1);
  }
  return [
    "\n=== Filtering ===\n",
    results.map(printResult).join("\n"),
    "\n=== Features ===\n",
    Array.from(features.entries())
      .sort(sortFeatureEntry)
      .map(printEntry)
      .join("\n"),
    "\n=== Totals ===\n",
    totals.map(printEntry).join("\n"),
  ].join("\n");
};

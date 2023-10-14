const { JSON, Map, Array } = globalThis;

/** @type {(line: string) => import("./types").Failure} */
const parseFailure = (line) => {
  const [relative, features, errors] = JSON.parse(line);
  return { relative, features, errors };
};

/** @type {(line: string) => boolean} */
const isNotEmpty = (line) => line !== "";

/** @type {(error: import("./types").TestError) => string} */
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

/** @type {(failure: import("./types").Failure) => string} */
const printFailure = ({ relative, features, errors }) =>
  `${relative}\n${printFeatureArray(features)}${errors
    .map(printError)
    .join("")}`;

/** @type {(entry1: [string, number], entry2: [string, number]) => number} */
const sortFeatureEntry = ([_feature1, count1], [_feature2, count2]) =>
  count2 - count1;

/** @type {<X, Y>(entry: [X, Y]) => string} */
const printEntry = ([key, val]) => `${key}: ${val}`;

/**
 * @type {(
 *   content: string,
 *   filters: [string, (failure: import("./types").Failure) => boolean][],
 * ) => string}
 */
export const report = (content, filters) => {
  let failures = content.split("\n").filter(isNotEmpty).map(parseFailure);
  /** @type {[string, number][]} */
  const totals = [["Total", failures.length]];
  for (const [name, predicate] of filters) {
    failures = failures.filter(predicate);
    totals.push([name, failures.length]);
  }
  /** @type {Map<string, number>} */
  const counters = new Map();
  for (const { features } of failures) {
    for (const feature of features) {
      counters.set(feature, (counters.get(feature) ?? 0) + 1);
    }
  }
  return [
    "Failures:",
    failures.map(printFailure).join("\n"),
    "",
    "Features:",
    Array.from(counters.entries())
      .sort(sortFeatureEntry)
      .map(printEntry)
      .join("\n"),
    "",
    totals.map(printEntry).join("\n"),
  ].join("\n");
};

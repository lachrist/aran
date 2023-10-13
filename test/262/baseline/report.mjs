/* eslint-disable no-console */
import { readFile } from "node:fs/promises";
import { cwd as getCwd } from "node:process";
import { pathToFileURL } from "node:url";
import { parseMetadata } from "../metadata.mjs";

const { URL, JSON, Map, Promise, Array, Set } = globalThis;

const cwd = pathToFileURL(`${getCwd()}/`);

/**
 * @typedef {{
 *   url: URL,
 *   features: string[],
 *   errors: import("../types").TestError[],
 * }} Failure
 */

/** @type {(content: string) => Promise<Failure>} */
const parseFailure = async (content) => {
  const [relative, errors] = JSON.parse(content);
  const url = new URL(relative, cwd);
  /** @type {string[]} */
  let features = [];
  const outcome = parseMetadata(await readFile(url, "utf8"));
  if (outcome.type === "success") {
    features = outcome.value.features;
  }
  return { url, features, errors };
};

/** @type {(line: string) => boolean} */
const isNotEmpty = (line) => line !== "";

/** @type {(error: import("../types").TestError) => string} */
const printError = (error) => {
  let print = `\n  ${error.type}`;
  if ("feature" in error) {
    print += ` >> ${error.feature}`;
  }
  if ("name" in error) {
    print += ` >> ${error.name}`;
  }
  if ("message" in error) {
    print += ` >> ${error.message}`;
  }
  return print;
};

/** @type {(failure: Failure) => string} */
const printFailure = ({ url, features, errors }) =>
  `${url}${features.join("+")}${errors.map(printError)}`;

/** @type {(error: import("../types").TestError) => boolean} */
const isRealmError = ({ type }) => type === "realm";

/** @type {(failure: Failure) => boolean} */
const isNotRealmFailure = ({ errors }) => !errors.some(isRealmError);

const failures1 = await Promise.all(
  (await readFile(new URL("./failures.txt", import.meta.url), "utf8"))
    .split("\n")
    .filter(isNotEmpty)
    .map(parseFailure),
);

const failures2 = failures1.filter(isNotRealmFailure);

/** @type {Map<string, number>} */
const report = new Map();

for (const { features } of failures2) {
  for (const feature of features) {
    report.set(feature, (report.get(feature) ?? 0) + 1);
  }
}

/** @type {(entry1: [string, number], entry2: [string, number]) => number} */
const sortFeatureEntry = ([_feature1, count1], [_feature2, count2]) =>
  count2 - count1;

const exclusion = new Set([
  "IsHTMLDDA",
  "Temporal",
  "Atomics",
  "tail-call-optimization",
  "Array.fromAsync",
  "iterator-helpers",
  "array-grouping",
  "Intl.DurationFormat",
  "ShadowRealm",
  "decorators",
  "Intl.Locale-info",
  "resizable-arraybuffer",
  "arraybuffer-transfer",
]);

/** @type {(feature: string) => boolean} */
const isFeatureExcluded = (feature) => exclusion.has(feature);

/** @type {(failure: Failure) => boolean} */
const isFailureNotExcluded = ({ features }) =>
  !features.some(isFeatureExcluded);

const failures3 = failures2.filter(isFailureNotExcluded);

console.log(failures3.map(printFailure).join("\n"));

console.log("\nFailure count per feature\n");

for (const [feature, count] of Array.from(report.entries()).sort(
  sortFeatureEntry,
)) {
  console.log(`${feature} >> ${count}`);
}

console.log("\nFailure count\n");

console.log(`Total failure: ${failures1.length}`);
console.log(`Non realm-related failure: ${failures2.length}`);
console.log(`Non excluded failure: ${failures3.length}`);

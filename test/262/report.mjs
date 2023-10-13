/* eslint-disable no-console */
import { readFile } from "node:fs/promises";
import { parseMetadata } from "./metadata.mjs";

const { URL, JSON, Map, Promise, Array } = globalThis;

/**
 * @typedef {{
 *   url: URL,
 *   features: string[],
 *   errors: import("./types").TestError[],
 * }} Failure
 */

/** @type {(line: string, test262: URL) => Promise<Failure>} */
const parseFailure = async (line, test262) => {
  const [relative, errors] = JSON.parse(line);
  const url = new URL(relative, test262);
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

/** @type {(error: import("./types").TestError) => string} */
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
const printFailure = ({ url, errors }) => `${url}${errors.map(printError)}`;

/** @type {(error: import("./types").TestError) => boolean} */
const isRealmError = ({ type }) => type === "realm";

/** @type {(failure: Failure) => boolean} */
const isNotRealmFailure = ({ errors }) => !errors.some(isRealmError);

/** @type {(entry1: [string, number], entry2: [string, number]) => number} */
const sortFeatureEntry = ([_feature1, count1], [_feature2, count2]) =>
  count2 - count1;

/**
 * @type {(
 *   options: {
 *     url: URL,
 *     test262: URL,
 *     exclusion: Set<string>,
 *   },
 * ) => Promise<void>}
 */
export const report = async ({ url, test262, exclusion }) => {
  const failures1 = await Promise.all(
    (await readFile(url, "utf8"))
      .split("\n")
      .filter(isNotEmpty)
      .map((line) => parseFailure(line, test262)),
  );

  const failures2 = failures1.filter(isNotRealmFailure);

  /** @type {Map<string, number>} */
  const report = new Map();

  for (const { features } of failures2) {
    for (const feature of features) {
      report.set(feature, (report.get(feature) ?? 0) + 1);
    }
  }

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
};

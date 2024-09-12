/* eslint-disable no-plusplus */

import { AranTypeError } from "../error.mjs";
import { loadResultArray } from "./load.mjs";

const { Object, Math } = globalThis;

/**
 * @type {(
 *   results: import("../result").Result[],
 * ) => import("./summary").Summary}
 */
const summarize = (results) => {
  /** @type {import("./summary").Summary} */
  const summary = {
    count: results.length,
    exclusion: {
      count: 0,
      repartition: /** @type {any} */ ({ __proto__: null }),
    },
    inclusion: {
      count: 0,
      true_negative: {
        count: 0,
        repartition: /** @type {any} */ ({ __proto__: null }),
      },
      false_negative: {
        count: 0,
        repartition: /** @type {any} */ ({ __proto__: null }),
      },
      false_positive: {
        count: 0,
      },
      true_positive: {
        count: 0,
      },
    },
  };
  for (const result of results) {
    if (result.type === "exclude") {
      summary.exclusion.count++;
      for (const tag of result.exclusion) {
        summary.exclusion.repartition[tag] =
          (summary.exclusion.repartition[tag] ?? 0) + 1;
      }
    } else if (result.type === "include") {
      summary.inclusion.count++;
      if (result.expect.length > 0) {
        const negative =
          result.actual === null
            ? summary.inclusion.false_negative
            : summary.inclusion.true_negative;
        negative.count += 1;
        for (const tag of result.expect) {
          negative.repartition[tag] = (negative.repartition[tag] ?? 0) + 1;
        }
      } else {
        if (result.actual === null) {
          summary.inclusion.true_positive.count++;
        } else {
          summary.inclusion.false_positive.count++;
        }
      }
    } else {
      throw new AranTypeError(result);
    }
  }
  return summary;
};

/**
 * @type {(
 *   entry1: [unknown, number],
 *   entry2: [unknown, number],
 * ) => number}
 */
const sortEntry = ([, i1], [, i2]) => i2 - i1;

/**
 * @type {(
 *   value: number,
 *   total: number,
 * ) => string}
 */
const toPercent = (value, total) => `${Math.round((value / total) * 100)}%`;

/**
 * @type {(
 *   name: string,
 *   value: number,
 *   total: number,
 * ) => string}
 */
const showEntry = (name, value, total) =>
  `${name}: ${value} [${toPercent(value, total)}]`;

/**
 * @type {(
 *   total: number,
 *   indent: string,
 * ) => (
 *   entry: [string, number],
 * ) => string}
 */
const compileShowEntry =
  (total, indent) =>
  ([name, value]) =>
    showEntry(`${indent}${name}`, value, total);

/**
 * @type {(
 *   summary: import("./summary").Summary,
 * ) => string}
 */
const showSummary = (summary) =>
  [
    `total: ${summary.count}`,
    showEntry("exclusion", summary.exclusion.count, summary.count),
    ...Object.entries(summary.exclusion.repartition)
      .sort(sortEntry)
      .map(compileShowEntry(summary.exclusion.count, "  ")),
    showEntry("inclusion", summary.inclusion.count, summary.count),
    showEntry(
      "  true-positive",
      summary.inclusion.true_positive.count,
      summary.inclusion.count,
    ),
    showEntry(
      "  false-positive",
      summary.inclusion.false_positive.count,
      summary.inclusion.count,
    ),
    showEntry(
      "  false-negative",
      summary.inclusion.false_negative.count,
      summary.inclusion.count,
    ),
    ...Object.entries(summary.inclusion.false_negative.repartition)
      .sort(sortEntry)
      .map(compileShowEntry(summary.inclusion.false_negative.count, "    ")),
    showEntry(
      "  true-negative",
      summary.inclusion.true_negative.count,
      summary.inclusion.count,
    ),
    ...Object.entries(summary.inclusion.true_negative.repartition)
      .sort(sortEntry)
      .map(compileShowEntry(summary.inclusion.true_negative.count, "    ")),
  ].join("\n");

console.log(showSummary(summarize(await loadResultArray("identity"))));

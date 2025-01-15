import { argv, stdout } from "node:process";
import { isStageName } from "../staging/index.mjs";
import { loadResultArray } from "./load.mjs";
import { isExcludeResult } from "../result.mjs";

const { undefined, Object, Math } = globalThis;

/**
 * @type {(
 *   results: import("../result").ResultEntry[],
 * ) => import("./summary").Summary}
 */
const summarize = (entries) => {
  /** @type {import("./summary").Summary} */
  const summary = {
    count: entries.length,
    exclusion: {
      count: 0,
      repartition: /** @type {any} */ ({ __proto__: null }),
    },
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
  };
  for (const [_, result] of entries) {
    if (isExcludeResult(result)) {
      summary.exclusion.count++;
      for (const tag of result) {
        summary.exclusion.repartition[tag] =
          (summary.exclusion.repartition[tag] ?? 0) + 1;
      }
    } else {
      const { actual, expect } = result;
      if (expect.length > 0) {
        const negative =
          actual === null ? summary.false_negative : summary.true_negative;
        negative.count += 1;
        for (const tag of expect) {
          negative.repartition[tag] = (negative.repartition[tag] ?? 0) + 1;
        }
      } else {
        if (actual === null) {
          summary.true_positive.count++;
        } else {
          summary.false_positive.count++;
        }
      }
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
    showEntry("inclusion", summary.count, summary.count),
    showEntry("  true-positive", summary.true_positive.count, summary.count),
    showEntry("  false-positive", summary.false_positive.count, summary.count),
    showEntry("  false-negative", summary.false_negative.count, summary.count),
    ...Object.entries(summary.false_negative.repartition)
      .sort(sortEntry)
      .map(compileShowEntry(summary.false_negative.count, "    ")),
    showEntry("  true-negative", summary.true_negative.count, summary.count),
    ...Object.entries(summary.true_negative.repartition)
      .sort(sortEntry)
      .map(compileShowEntry(summary.true_negative.count, "    ")),
  ].join("\n");

/**
 * @type {(
 *   argv: string[],
 * ) => Promise<void>}
 */
const main = async (argv) => {
  if (argv.length === 1) {
    const stage = argv[0];
    if (isStageName(stage)) {
      stdout.write(showSummary(summarize(await loadResultArray(stage))));
      stdout.write("\n");
    } else {
      stdout.write(`invalid stage: ${stage}\n`);
    }
  } else {
    stdout.write("usage: node test/262/query/summary.mjs <stage>\n");
    return undefined;
  }
};

await main(argv.slice(2));

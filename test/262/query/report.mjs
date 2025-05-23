import { argv, stdout } from "node:process";
import { isStageName } from "../staging/index.mjs";
import { loadStageResult } from "../staging/result.mjs";
import { AranTypeError } from "../error.mjs";

const { undefined, Object, Math } = globalThis;

/**
 * @type {(
 *   results: AsyncIterable<[
 *     import("../test-case.d.ts").TestIndex,
 *     import("../result.d.ts").Result,
 *   ]>,
 * ) => Promise<import("./report.d.ts").Report>}
 */
const aggregate = async (results) => {
  /** @type {import("./report.d.ts").Report} */
  const report = {
    count: 0,
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
  for await (const [_index, result] of results) {
    report.count++;
    if (result.type === "exclude") {
      report.exclusion.count++;
      for (const tag of result.reasons) {
        report.exclusion.repartition[tag] =
          (report.exclusion.repartition[tag] ?? 0) + 1;
      }
    } else if (result.type === "include") {
      const { actual, expect } = result;
      if (expect.length > 0) {
        const negative =
          actual === null ? report.false_negative : report.true_negative;
        negative.count += 1;
        for (const tag of expect) {
          negative.repartition[tag] = (negative.repartition[tag] ?? 0) + 1;
        }
      } else {
        if (actual === null) {
          report.true_positive.count++;
        } else {
          report.false_positive.count++;
        }
      }
    } else {
      throw new AranTypeError(result);
    }
  }
  return report;
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
 *   summary: import("./report.d.ts").Report,
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
      stdout.write(showSummary(await aggregate(loadStageResult(stage))));
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

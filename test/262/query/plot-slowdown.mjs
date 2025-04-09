import { fileURLToPath } from "url";
import { AranExecError } from "../error.mjs";
import { loadStageResult } from "../staging/result.mjs";
import { argv, stderr } from "node:process";
import { isStageName } from "../staging/index.mjs";
import { plotBox } from "./plot.mjs";

const {
  process,
  URL,
  Object: { fromEntries },
} = globalThis;

const reduceEntry = /**
 * @type {<K extends string, V>(
 *   entries: [K, V][],
 * ) => Record<K, V>}
 */ (fromEntries);

/**
 * @typedef {{
 *   name: import("../staging/stage-name.d.ts").StageName,
 *   results: import("../result.d.ts").Result[],
 * }} StageResult
 */

//////////////
// Slowdown //
//////////////

/**
 * @type {(
 *   entry1: import("../result.d.ts").Result,
 *   entry2: import("../result.d.ts").Result,
 * ) => number | null}
 */
const computeSlowdown = (result1, result2) => {
  if (result1.type === "exclude" || result2.type === "exclude") {
    return null;
  }
  if (
    result1.time !== null &&
    result2.time !== null &&
    result1.actual === null &&
    result2.actual === null
  ) {
    const slowdown =
      (result2.time.user + result2.time.system) /
      (result1.time.user + result1.time.system);
    if (slowdown < 1) {
      return null;
    } else {
      return slowdown;
    }
  } else {
    return null;
  }
};

/**
 * @type {(
 *   base: import("../result.d.ts").Result[],
 *   other: import("../result.d.ts").Result[],
 * ) => number[]}
 */
const crunchSlowdown = (base, other) => {
  if (base.length !== other.length) {
    throw new AranExecError("result length mismatch", { base, other });
  }
  return base
    .map((result1, index) => computeSlowdown(result1, other[index]))
    .filter((slowdown) => slowdown !== null);
};

/**
 * @type {(
 *   base: StageResult,
 *   other: StageResult,
 * ) => [string, number[]]}
 */
const toSlowdownEntry = (
  { results: results1 },
  { name, results: results2 },
) => [name, crunchSlowdown(results1, results2)];

/**
 * @type {(
 *   base: StageResult,
 *   others: StageResult[],
 * ) => import("./plot.d.ts").BoxPlot}
 */
const prepareSlowdownPlot = (base, others) => ({
  output: fileURLToPath(new URL("slowdown.png", import.meta.url)),
  title: "Overal Overhead",
  content: reduceEntry(others.map((other) => toSlowdownEntry(base, other))),
  show_flier: false,
});

//////////
// main //
//////////

/**
 * @type {(
 *   name: import("../staging/stage-name.d.ts").StageName,
 * ) => Promise<StageResult>}
 */
const loadStageResultArray = async (name) => {
  /**
   * @type {import("../result.d.ts").Result[]}
   */
  const results = [];
  for await (const [_index, result] of loadStageResult(name)) {
    results.push(result);
  }
  return { name, results };
};

/**
 * @type {(
 *   argv: string[],
 * ) => Promise<null | string>}
 */
const main = async (argv) => {
  if (argv.length < 2) {
    return "usage: node test/262/query/plot.mjs <base> <other>...\n";
  }
  if (!argv.every(isStageName)) {
    return `invalid stage names: ${argv.filter((arg) => !isStageName(arg))}\n`;
  }
  const [base_stage, ...other_stage_array] = argv;
  const base = await loadStageResultArray(base_stage);
  const others = [];
  for (const other_stage of other_stage_array) {
    others.push(await loadStageResultArray(other_stage));
  }
  await plotBox(prepareSlowdownPlot(base, others));
  return null;
};

{
  const status = await main(argv.slice(2));
  if (status !== null) {
    stderr.write(status);
    process.exitCode ||= 1;
  }
}

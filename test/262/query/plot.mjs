import { fileURLToPath } from "url";
import { AranExecError } from "../error.mjs";
import { loadStageResult } from "../staging/result.mjs";
import { spawn } from "node:child_process";
import { argv, stderr } from "node:process";
import { isStageName } from "../staging/stage-name-predicate.mjs";

const { process, Promise, URL, JSON } = globalThis;

//////////////
// Slowdown //
//////////////

/**
 * @type {(
 *   entry1: import("../result").Result,
 *   entry2: import("../result").Result,
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
 *   base: import("../result").Result[],
 *   other: import("../result").Result[],
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
 *   base: import("./plot").StageResult,
 *   others: import("./plot").StageResult[],
 * ) => import("./plot").Plot}
 */
const prepareSlowdownPlot = (base, others) => ({
  output: fileURLToPath(new URL("slowdown.png", import.meta.url)),
  title: "Overal Overhead",
  labels: others.map((other) => other.name),
  data: others.map((other) => crunchSlowdown(base.results, other.results)),
});

//////////
// main //
//////////

/**
 * @type {(
 *   name: import("../staging/stage-name").StageName,
 * ) => Promise<import("./plot").StageResult>}
 */
const loadStageResultArray = async (name) => {
  /**
   * @type {import("../result").Result[]}
   */
  const results = [];
  for await (const result of loadStageResult(name)) {
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
  const plots = [prepareSlowdownPlot(base, others)];
  /**
   * @type {{
   *   code: number | null,
   *   signal: NodeJS.Signals | null,
   * }}
   */
  const { code, signal } = await new Promise((resolve, reject) => {
    const child = spawn(
      "python3",
      [fileURLToPath(new URL("plot.py", import.meta.url))],
      { stdio: ["pipe", "inherit", "inherit"] },
    );
    child.on("error", reject);
    child.on("exit", (code, signal) => {
      resolve({ code, signal });
    });
    child.stdin.write(JSON.stringify(plots), "utf-8");
    child.stdin.end();
  });
  if (code !== 0 || signal !== null) {
    throw new AranExecError("plot.py failed", { code, signal });
  }
  return null;
};

{
  const status = await main(argv.slice(2));
  if (status !== null) {
    stderr.write(status);
    process.exitCode ||= 1;
  }
}

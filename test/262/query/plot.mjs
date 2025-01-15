import { fileURLToPath } from "url";
import { AranExecError } from "../error.mjs";
import { loadResultArray } from "./load.mjs";
import { spawn } from "child_process";
import { argv, stdout } from "process";
import { isStageName } from "../stagging/stage.mjs";

const { Promise, URL, JSON } = globalThis;

///////////
// Ratio //
///////////

/**
 * @type {(
 *   result: import("../result").ResultEntry,
 * ) => number | null}
 */
const computeRatio = (result) => {
  if (result.time !== null && result.actual === null) {
    const ratio =
      (result.time.instrument.user + result.time.instrument.system) /
      (result.time.total.user + result.time.total.system);
    if (ratio > 1) {
      throw new AranExecError("ratio > 1", { result });
    } else {
      return ratio;
    }
  } else {
    return null;
  }
};

/**
 * @type {(
 *   others: import("./plot").StageResult[],
 * ) => import("./plot").Plot}
 */
const prepareRatioPlot = (others) => ({
  output: fileURLToPath(new URL("ratio.png", import.meta.url)),
  title: "Instrumentation Ratio",
  labels: others.map((other) => other.name),
  data: others.map((other) =>
    other.results
      .map((result) => computeRatio(result))
      .filter((ratio) => ratio !== null),
  ),
});

//////////////
// Slowdown //
//////////////

/**
 * @type {(
 *   result1: import("../result").ResultEntry,
 *   result2: import("../result").ResultEntry,
 * ) => number | null}
 */
const computeSlowdown = (result1, result2) => {
  if (result1.path === result2.path) {
    if (
      result1.time !== null &&
      result2.time !== null &&
      result1.actual === null &&
      result2.actual === null
    ) {
      const slowdown =
        (result2.time.total.user + result2.time.total.system) /
        (result1.time.total.user + result1.time.total.system);
      if (slowdown < 1) {
        return null;
      } else {
        return slowdown;
      }
    } else {
      return null;
    }
  } else {
    throw new AranExecError("result path mismatch", { result1, result2 });
  }
};

/**
 * @type {(
 *   base: import("../result").ResultEntry[],
 *   other: import("../result").ResultEntry[],
 * ) => number[]}
 */
const crunchSlowdown = (base, other) => {
  if (base.length !== other.length) {
    throw new AranExecError("result length mismatch", { base, other });
  } else {
    return base
      .map((result1, index) => computeSlowdown(result1, other[index]))
      .filter((slowdown) => slowdown !== null);
  }
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
 *   name: import("../stagging/stage").StageName,
 * ) => Promise<import("./plot").StageResult>}
 */
const loadStageResult = async (name) => ({
  name,
  results: await loadResultArray(name),
});

/**
 * @type {(
 *   argv: string[],
 * ) => Promise<void>}
 */
const main = async (argv) => {
  if (argv.length < 2) {
    stdout.write("usage: node test/262/query/plot.mjs <base> <other>...\n");
  } else {
    if (argv.every(isStageName)) {
      const [base_stage, ...other_stage_array] = argv;
      const base = await loadStageResult(base_stage);
      const others = [];
      for (const other_stage of other_stage_array) {
        others.push(await loadStageResult(other_stage));
      }
      const plots = [
        prepareSlowdownPlot(base, others),
        prepareRatioPlot(others),
      ];
      /** @type {{code: number | null , signal: NodeJS.Signals | null }} */
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
        child.stdin.write(JSON.stringify(plots), "utf8");
        child.stdin.end();
      });
      if (code !== 0 || signal !== null) {
        throw new AranExecError("plot.py failed", { code, signal });
      }
    } else {
      for (const arg of argv) {
        if (!isStageName(arg)) {
          stdout.write(`invalid stage name: ${arg}\n`);
        }
      }
    }
  }
};

await main(argv.slice(2));

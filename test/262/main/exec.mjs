import { createSignal } from "../util/index.mjs";
import { argv, stderr, stdout } from "node:process";
import { runStage } from "../staging/stage.mjs";
import { loadTestCase } from "../catalog/index.mjs";
import { getStageName } from "./argv.mjs";
import { onUncaughtException } from "./uncaught.mjs";
import { saveStageResult } from "../staging/result.mjs";
import { printReport } from "../report.mjs";

const { process, Date } = globalThis;

/**
 * @type {(
 *   result: import("../result.d.ts").Result,
 * ) => boolean}
 */
const hasFalsePrediction = (result) =>
  result.type === "include" &&
  (result.actual === null) !== (result.expect.length === 0);

/**
 * @type {(
 *   stage: import("../staging/stage-name.d.ts").StageName,
 *   tests: AsyncIterable<[
 *     import("../test-case.d.ts").TestIndex,
 *     import("../test-case.d.ts").TestCase,
 *   ]>,
 *   sigint: import("../util/signal.d.ts").Signal<boolean>,
 * ) => AsyncGenerator<import("../result.d.ts").Result>}
 */
const exec = async function* (stage, tests, sigint) {
  for await (const { index, test, result } of runStage(stage, tests, {
    record_directory: null,
    memoization: "eager",
  })) {
    if (index % 100 === 0) {
      stdout.write(`${index}\n`);
    }
    if (hasFalsePrediction(result)) {
      stderr.write(printReport({ index, test, result }) + "\n");
    }
    yield result;
    if (sigint.get()) {
      break;
    }
  }
};

/**
 * @type {(
 *   argv: string[],
 * ) => Promise<0 | 1>}
 */
const main = async (argv) => {
  const stage = getStageName(argv);
  if (stage === null) {
    stderr.write("USAGE\n");
    stderr.write(
      ">> node --experimental-vm-modules --expose-gc test/262/main/exec.mjs <stage>\n",
    );
    return 1;
  } else {
    const sigint = createSignal(false);
    const onSigint = () => {
      sigint.value = true;
    };
    process.addListener("SIGINT", onSigint);
    process.addListener("uncaughtException", onUncaughtException);
    const now = Date.now();
    try {
      await saveStageResult(stage, exec(stage, loadTestCase(), sigint));
    } finally {
      process.removeListener("SIGINT", onSigint);
      process.removeListener("uncaughtException", onUncaughtException);
    }
    if (sigint.value) {
      stderr.write("SIGINT\n");
      return 1;
    } else {
      stdout.write("DONE\n");
      stdout.write(`>> ${Date.now() - now}ms\n`);
      return 0;
    }
  }
};

process.exitCode ||= await main(argv.slice(2));

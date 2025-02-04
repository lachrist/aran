import { createSignal } from "../util/index.mjs";
import { argv, stderr, stdout } from "node:process";
import { runStage } from "../staging/stage.mjs";
import { saveStageResultEntry } from "../staging/result-entry.mjs";
import { loadTestCase } from "../catalog/index.mjs";
import { getStageName } from "./argv.mjs";
import { onUncaughtException } from "./uncaught.mjs";
import { AranExecError, AranTypeError } from "../error.mjs";
import { interruptIterable } from "../util/iterable.mjs";

const { process, Date } = globalThis;

/**
 * @type {(
 *   entry: import("../result").ResultEntry,
 * ) => void}
 */
const logFalsePrediction = ([specifier, result]) => {
  if (result.type === "include") {
    if (result.actual === null && result.expect.length > 0) {
      stderr.write(`FALSE NEGATIVE >> ${specifier}\n`);
    }
    if (result.actual !== null && result.expect.length === 0) {
      stderr.write(`FALSE POSITIVE >> ${specifier}\n`);
    }
  }
};

/**
 * @type {(
 *   stage: import("../staging/stage-name").StageName,
 *   sigint: import("../util/signal").Signal<boolean>,
 * ) => AsyncGenerator<import("../result").ResultEntry>}
 */
const exec = async function* (stage, sigint) {
  let index = 0;
  for await (const entry of runStage(
    stage,
    interruptIterable(loadTestCase(), sigint),
    {
      record_directory: null,
      memoization: "eager",
    },
  )) {
    if (index % 100 === 0) {
      stdout.write(`${index}\n`);
    }
    if (entry === null) {
      throw new AranExecError("entry is null");
    }
    logFalsePrediction(entry);
    yield entry;
    index++;
  }
};

/**
 * @type {(
 *   argv: string[],
 * ) => Promise<"done" | "usage" | "sigint">}
 */
const main = async (argv) => {
  const stage = getStageName(argv);
  if (stage === null) {
    return "usage";
  } else {
    const sigint = createSignal(false);
    const onSigint = () => {
      sigint.value = true;
    };
    process.addListener("SIGINT", onSigint);
    process.addListener("uncaughtException", onUncaughtException);
    try {
      await saveStageResultEntry(stage, exec(stage, sigint));
    } finally {
      process.removeListener("SIGINT", onSigint);
      process.removeListener("uncaughtException", onUncaughtException);
    }
    return sigint.value ? "sigint" : "done";
  }
};

{
  const now = Date.now();
  const status = await main(argv.slice(2));
  if (status === "usage") {
    stderr.write("USAGE\n");
    stderr.write(
      ">> node --experimental-vm-modules --expose-gc test/262/exec.mjs <stage>\n",
    );
    process.exitCode ||= 1;
  } else if (status === "sigint") {
    stderr.write("SIGINT\n");
    process.exitCode ||= 1;
  } else if (status === "done") {
    stdout.write("DONE\n");
    stdout.write(`>> ${Date.now() - now}ms\n`);
  } else {
    throw new AranTypeError(status);
  }
}

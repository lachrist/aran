/* eslint-disable local/no-function */

import { createSignal } from "../util/index.mjs";
import { argv, stderr, stdout } from "node:process";
import { compileStage } from "../staging/stage.mjs";
import { saveStageResultEntry } from "../staging/result-entry.mjs";
import { toTestSpecifier } from "../result.mjs";
import { loadTestCase } from "../catalog/index.mjs";
import { getStageName } from "./argv.mjs";
import { onUncaughtException } from "./uncaught.mjs";
import { AranTypeError } from "../error.mjs";

const { process, Date } = globalThis;

/**
 * @type {(
 *   stage: import("../staging/stage-name").StageName,
 *   sigint: import("../util/signal").Signal<boolean>,
 * ) => AsyncGenerator<
 *   import("../result").ResultEntry,
 *   "done" | "sigint"
 * >}
 */
const exec = async function* (stage, sigint) {
  const execTestCase = await compileStage(stage, { memoization: "eager" });
  let index = 0;
  for await (const test of loadTestCase()) {
    if (sigint.get()) {
      return "sigint";
    }
    if (index % 100 === 0) {
      stdout.write(`${index}\n`);
    }
    index++;
    const specifier = toTestSpecifier(test.path, test.directive);
    const result = await execTestCase(test);
    if (result.type === "include") {
      if (result.actual === null && result.expect.length > 0) {
        stderr.write(`FALSE NEGATIVE >> ${specifier}\n`);
      }
      if (result.actual !== null && result.expect.length === 0) {
        stderr.write(`FALSE POSITIVE >> ${specifier}\n`);
      }
    }
    yield [specifier, result];
  }
  return "done";
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

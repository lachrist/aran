/* eslint-disable logical-assignment-operators */
/* eslint-disable local/no-function */

import { createSignal } from "../util/index.mjs";
import { argv, stderr, stdout } from "node:process";
import { compileStage, saveStageResultEntry } from "../staging/index.mjs";
import { toTestSpecifier } from "../result.mjs";
import { loadTestCase } from "../catalog/index.mjs";
import { getStageName } from "./argv.mjs";
import { onUncaughtException } from "./uncaught.mjs";

const { process, Date, JSON } = globalThis;

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
    yield [
      toTestSpecifier(test.path, test.directive),
      await execTestCase(test),
    ];
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
    stdout.write("SUCCESS\n");
    stdout.write(`>> ${Date.now() - now}ms\n`);
  } else {
    stdout.write("FAILURE\n");
    stdout.write(JSON.stringify(status, null, 2));
  }
}

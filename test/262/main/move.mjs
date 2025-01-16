/* eslint-disable logical-assignment-operators */

import { argv, stderr, stdout } from "node:process";
import { createSignal } from "../util/index.mjs";
import { loadCursor, saveCursor } from "./cursor.mjs";
import { compileStage } from "../staging/index.mjs";
import { isExcludeResult } from "../result.mjs";
import { loadTestCase } from "../catalog/index.mjs";
import { getStageName } from "./argv.mjs";
import { onUncaughtException } from "./uncaught.mjs";
import { inspect } from "node:util";
import { showTargetPath } from "../fetch.mjs";
import { ROOT, TEST262 } from "../layout.mjs";

const { process, Infinity } = globalThis;

/**
 * @type {(
 *   stage: import("../staging/stage-name").StageName,
 *   cursor: number,
 *   sigint: import("../util/signal").Signal<boolean>,
 * ) => Promise<{
 *   cursor: number,
 *   failure: null | {
 *     test: import("../test-case").TestCase,
 *     result: import("../result").Result,
 *   },
 * }>}
 */
const move = async (stage, cursor, sigint) => {
  const exec = await compileStage(stage, {
    memoization: "lazy",
    record: null,
  });
  let index = 0;
  for await (const test of loadTestCase()) {
    if (index % 100 === 0) {
      stdout.write(`${index}\n`);
    }
    if (sigint.get()) {
      return { cursor: index, failure: null };
    }
    if (index >= cursor) {
      const result = await exec(test);
      if (!isExcludeResult(result)) {
        const { actual, expect } = result;
        if ((actual === null) !== (expect.length === 0)) {
          return { cursor: index, failure: { test, result } };
        }
      }
    }
    index++;
  }
  return { cursor: 0, failure: null };
};

/**
 * @type {(
 *   argv: string[],
 * ) => Promise<(
 *   | "usage"
 *   | "done"
 *   | "sigint"
 *   | {
 *     test: import("../test-case").TestCase,
 *     result: import("../result").Result,
 *   }
 * )>}
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
      const { cursor, failure } = await move(stage, await loadCursor(), sigint);
      await saveCursor(cursor);
      return sigint.value ? "sigint" : failure === null ? "done" : failure;
    } finally {
      process.removeListener("SIGINT", onSigint);
      process.removeListener("uncaughtException", onUncaughtException);
    }
  }
};

{
  const status = await main(argv.slice(2));
  if (status === "usage") {
    stderr.write("USAGE\n");
    stderr.write(
      "  node --experimental-vm-modules --expose-gc test/262/move.mjs <stage>\n",
    );
    process.exitCode ||= 1;
  } else if (status === "sigint") {
    stderr.write("SIGINT\n");
    process.exitCode ||= 1;
  } else if (status === "done") {
    stdout.write("SUCCESS\n");
  } else {
    stdout.write("FAILURE\n");
    stdout.write(showTargetPath(status.test.path, TEST262, ROOT) + "\n");
    stdout.write(inspect(status, { depth: Infinity, colors: true }) + "\n");
  }
}

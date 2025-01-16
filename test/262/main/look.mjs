/* eslint-disable logical-assignment-operators */
import { cleanup, record } from "../record/index.mjs";
import { stdout, stderr, argv } from "node:process";
import { loadCursor } from "./cursor.mjs";
import { compileStage } from "../staging/index.mjs";
import { grabTestCase } from "../catalog/index.mjs";
import { getStageName } from "./argv.mjs";
import { onUncaughtException } from "./uncaught.mjs";
import { inspect } from "node:util";
import { showTargetPath } from "../fetch.mjs";
import { ROOT, TEST262 } from "../layout.mjs";

const { Error, Infinity, URL, process } = globalThis;

Error.stackTraceLimit = Infinity;

const RECORD = new URL("record/", import.meta.url);

/**
 * @type {(
 *   stage: import("../staging/stage-name").StageName,
 * ) => Promise<{
 *   cursor: number,
 *   test: import("../test-case").TestCase,
 *   result: import("../result").Result
 * }>}
 */
const look = async (stage) => {
  await cleanup(RECORD);
  const cursor = await loadCursor();
  const exec = await compileStage(stage, {
    memoization: "none",
    record: (file) => record(file, RECORD),
  });
  process.addListener("uncaughtException", onUncaughtException);
  try {
    const test = await grabTestCase(cursor);
    return { cursor, test, result: await exec(test) };
  } finally {
    process.removeListener("uncaughtException", onUncaughtException);
  }
};

/**
 * @type {(
 *   argv: string[],
 * ) => Promise<"usage" | {
 *   cursor: number,
 *   test: import("../test-case").TestCase,
 *   result: import("../result").Result,
 * }>}
 */
const main = async (argv) => {
  const stage = getStageName(argv);
  if (stage === null) {
    return "usage";
  } else {
    process.on("uncaughtException", onUncaughtException);
    try {
      return await look(stage);
    } finally {
      process.removeListener("uncaughtException", onUncaughtException);
    }
  }
};

{
  const status = await main(argv.slice(2));
  if (status === "usage") {
    stderr.write(
      ">> node --experimental-vm-modules --expose-gc test/262/look.mjs <stage>\n",
    );
    process.exitCode ||= 1;
  } else {
    stdout.write("\n");
    stdout.write(showTargetPath(status.test.path, TEST262, ROOT) + "\n");
    stdout.write("\n");
    stdout.write(inspect(status, { depth: Infinity, colors: true }) + "\n");
  }
}

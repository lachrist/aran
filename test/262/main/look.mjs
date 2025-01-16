/* eslint-disable logical-assignment-operators */
import { record } from "../record/index.mjs";
import { stdout, stderr, argv } from "node:process";
import { loadCursor } from "./cursor.mjs";
import { compileStage } from "../staging/index.mjs";
import { grabTestCase } from "../catalog/index.mjs";
import { getStageName } from "./argv.mjs";
import { onUncaughtException } from "./uncaught.mjs";

const { JSON, URL, process } = globalThis;

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
    stdout.write(JSON.stringify(await main(argv.slice(2))) + "\n");
  }
}

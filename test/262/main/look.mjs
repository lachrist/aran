import { stdout, stderr, argv } from "node:process";
import { loadCursor } from "./cursor.mjs";
import { runStage } from "../staging/stage.mjs";
import { grabTestCase } from "../catalog/index.mjs";
import { getStageName } from "./argv.mjs";
import { onUncaughtException } from "./uncaught.mjs";
import { inspect } from "node:util";
import { showTargetPath } from "../fetch.mjs";
import { ROOT, TEST262 } from "../layout.mjs";
import { AranExecError } from "../error.mjs";

const { URL, Error, Infinity, process } = globalThis;

Error.stackTraceLimit = Infinity;

/**
 * @type {<X>(
 *   item: X,
 * ) => AsyncGenerator<X>}
 */
const wrapItem = async function* (item) {
  yield item;
};

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
  const test = await grabTestCase(cursor);
  const results = [];
  for await (const [, result] of runStage(stage, wrapItem(test), {
    memoization: "none",
    record_directory: new URL("record/", import.meta.url),
  })) {
    results.push(result);
  }
  if (results.length !== 1) {
    throw new AranExecError("result length mismatch", { results });
  }
  return { cursor, test, result: results[1] };
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
    stderr.write("USAGE\n");
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

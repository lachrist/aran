import { argv, stderr, stdout } from "node:process";
import { createSignal } from "../util/index.mjs";
import { loadCursor, saveCursor } from "./cursor.mjs";
import { runStage } from "../staging/stage.mjs";
import { loadTestCase } from "../catalog/index.mjs";
import { getStageName } from "./argv.mjs";
import { onUncaughtException } from "./uncaught.mjs";
import { inspect } from "node:util";
import { showTargetPath } from "../fetch.mjs";
import { ROOT, TEST262 } from "../layout.mjs";
import { interruptIterable, mapIterable } from "../util/iterable.mjs";
import { parseTestSpecifier } from "../result.mjs";

const { process, Infinity } = globalThis;

/**
 * @type {(
 *   stage: import("../staging/stage-name").StageName,
 *   cursor: number,
 *   sigint: import("../util/signal").Signal<boolean>,
 * ) => Promise<{
 *   cursor: number,
 *   error: null | import("../result").ResultEntry,
 * }>}
 */
const move = async (stage, cursor, sigint) => {
  let index = 0;
  for await (const entry of runStage(
    stage,
    mapIterable(interruptIterable(loadTestCase(), sigint), (test, index) =>
      index >= cursor ? test : null,
    ),
    {
      record_directory: null,
      memoization: "eager",
    },
  )) {
    if (index % 100 === 0) {
      stdout.write(`${index}\n`);
    }
    if (entry !== null) {
      const [specifier, result] = entry;
      if (result.type === "include") {
        const { actual, expect } = result;
        if ((actual === null) !== (expect.length === 0)) {
          return { cursor: index, error: [specifier, result] };
        }
      }
    }
    index++;
  }
  return { cursor: index, error: null };
};

/**
 * @type {(
 *   argv: string[],
 * ) => Promise<(
 *   | "usage"
 *   | "done"
 *   | "sigint"
 *   | import("../result").ResultEntry
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
      const { cursor, error } = await move(stage, await loadCursor(), sigint);
      if (error === null) {
        await saveCursor(sigint.value ? cursor : 0, null);
        return sigint.value ? "sigint" : "done";
      } else {
        await saveCursor(cursor, error[0]);
        return error;
      }
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
    stdout.write(
      showTargetPath(parseTestSpecifier(status[0]).path, ROOT, TEST262) + "\n",
    );
    stdout.write(inspect(status, { depth: Infinity, colors: true }) + "\n");
  }
}

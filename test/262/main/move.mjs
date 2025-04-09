import { argv, stderr, stdout } from "node:process";
import { createSignal } from "../util/index.mjs";
import { loadCursor, saveCursor } from "./cursor.mjs";
import { runStage } from "../staging/stage.mjs";
import { loadTestCase } from "../catalog/index.mjs";
import { getStageName } from "./argv.mjs";
import { onUncaughtException } from "./uncaught.mjs";
import { filterIterable, interruptIterable } from "../util/iterable.mjs";
import { printReport } from "../report.mjs";

const { process } = globalThis;

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
 *   argv: string[],
 * ) => Promise<0 | 1>}
 */
const main = async (argv) => {
  const stage = getStageName(argv);
  if (stage === null) {
    stderr.write("USAGE\n");
    stderr.write(
      ">> node --experimental-vm-modules --expose-gc test/262/main/move.mjs <stage>\n",
    );
    return 1;
  } else {
    const sigint = createSignal(false);
    const onSigint = () => {
      sigint.value = true;
    };
    process.addListener("SIGINT", onSigint);
    process.addListener("uncaughtException", onUncaughtException);
    try {
      const cursor = await loadCursor();
      for await (const { index, test, result } of runStage(
        stage,
        filterIterable(
          interruptIterable(loadTestCase(), sigint),
          ([index, _test]) => index >= cursor,
        ),
        {
          record_directory: null,
          memoization: "eager",
        },
      )) {
        if (index % 100 === 0) {
          stdout.write(`${index}\n`);
        }
        if (hasFalsePrediction(result)) {
          await saveCursor(index, test);
          stderr.write("FAILURE\n");
          stderr.write(printReport({ index, test, result }) + "\n");
          return 1;
        }
        if (sigint.get()) {
          await saveCursor(index, test);
          stderr.write("SIGINT\n");
          return 1;
        }
      }
      await saveCursor(0, null);
      stdout.write("SUCCESS\n");
      return 0;
    } finally {
      process.removeListener("SIGINT", onSigint);
      process.removeListener("uncaughtException", onUncaughtException);
    }
  }
};

process.exitCode ||= await main(argv.slice(2));

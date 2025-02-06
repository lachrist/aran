import { stdout, stderr, argv } from "node:process";
import { loadCursor } from "./cursor.mjs";
import { runStage } from "../staging/stage.mjs";
import { loadTestCase } from "../catalog/index.mjs";
import { getStageName } from "./argv.mjs";
import { onUncaughtException } from "./uncaught.mjs";
import { filterIterable } from "../util/iterable.mjs";
import { printReport } from "../report.mjs";

const { URL, Error, Infinity, process } = globalThis;

Error.stackTraceLimit = Infinity;

/**
 * @type {(
 *   argv: string[],
 * ) => Promise<1 | 0>}
 */
const main = async (argv) => {
  const stage = getStageName(argv);
  if (stage === null) {
    stderr.write("USAGE\n");
    stderr.write(
      ">> node --experimental-vm-modules --expose-gc test/262/main/look.mjs <stage>\n",
    );
    return 1;
  } else {
    process.on("uncaughtException", onUncaughtException);
    try {
      const cursor = await loadCursor();
      for await (const report of runStage(
        stage,
        filterIterable(loadTestCase(), ([index, _test]) => index === cursor),
        {
          memoization: "none",
          record_directory: new URL("record/", import.meta.url),
        },
      )) {
        stdout.write(printReport(report) + "\n");
      }
    } finally {
      process.removeListener("uncaughtException", onUncaughtException);
    }
    return 0;
  }
};

process.exitCode ||= await main(argv.slice(2));

import { stdout, stderr, argv } from "node:process";
import { loadCursor } from "./cursor.mjs";
import { runStage } from "../staging/stage.mjs";
import { loadTestCase } from "../catalog/index.mjs";
import { getStageName } from "./argv.mjs";
import { onUncaughtException } from "./uncaught.mjs";
import { inspect } from "node:util";
import { mapIterable } from "../util/iterable.mjs";
import { parseTestSpecifier } from "../result.mjs";

const { URL, Error, Infinity, process } = globalThis;

Error.stackTraceLimit = Infinity;

/**
 * @type {(
 *   stage: import("../staging/stage-name").StageName,
 * ) => Promise<void>}
 */
const look = async (stage) => {
  const cursor = await loadCursor();
  for await (const entry of await runStage(
    stage,
    mapIterable(loadTestCase(), (test, index) =>
      index === cursor ? test : null,
    ),
    {
      memoization: "none",
      record_directory: new URL("record/", import.meta.url),
    },
  )) {
    if (entry !== null) {
      const [specifier, result] = entry;
      stdout.write("\n");
      stdout.write(
        `test/262/test262/test/${parseTestSpecifier(specifier).path}\n`,
      );
      stdout.write("\n");
      stdout.write(inspect(result, { depth: Infinity, colors: true }) + "\n");
    }
  }
};

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
      ">> node --experimental-vm-modules --expose-gc test/262/look.mjs <stage>\n",
    );
    return 1;
  } else {
    process.on("uncaughtException", onUncaughtException);
    try {
      await look(stage);
    } finally {
      process.removeListener("uncaughtException", onUncaughtException);
    }
    return 0;
  }
};

{
  const status = await main(argv.slice(2));
  process.exitCode ||= status;
}

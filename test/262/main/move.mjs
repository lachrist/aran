import { argv, stderr, stdout } from "node:process";
import { inspectErrorMessage, inspectErrorName } from "../util/index.mjs";
import { loadCursor, saveCursor } from "./cursor.mjs";
import { compileStage } from "../staging/index.mjs";
import { isExcludeResult } from "../result.mjs";
import { enumTestCase } from "../catalog/index.mjs";
import { getStageName } from "./argv.mjs";

const {
  process,
  JSON: { stringify },
} = globalThis;

/**
 * @type {(
 *   argv: string[],
 * ) => Promise<0 | 1>}
 */
const main = async (argv) => {
  const stage = getStageName(argv);
  if (stage === null) {
    stderr.write(
      "usage: node --experimental-vm-modules --expose-gc test/262/move.mjs <stage>\n",
    );
    return 1;
  }
  const cursor = await loadCursor();
  const exec = await compileStage(stage, {
    memoization: "lazy",
    record: null,
  });
  let index = 0;
  const onUncaughtException = (/** @type {unknown} */ error) => {
    stdout.write(
      `uncaught >> ${inspectErrorName(error)} >> ${inspectErrorMessage(error)}\n`,
    );
  };
  process.addListener("uncaughtException", onUncaughtException);
  let sigint = false;
  const onSigint = () => {
    sigint = true;
  };
  process.addListener("SIGINT", onSigint);
  try {
    for await (const test of enumTestCase()) {
      if (sigint) {
        return 1;
      }
      if (index % 100 === 0) {
        stdout.write(`${index}\n`);
      }
      if (index >= cursor) {
        const result = await exec(test);
        if (!isExcludeResult(result)) {
          const { actual, expect } = result;
          if ((actual === null) !== (expect.length === 0)) {
            stderr.write(`${stringify({ test, result }, null, 2)}\n`);
            return 1;
          }
        }
      }
      index += 1;
    }
    index = 0;
    return 0;
  } finally {
    await saveCursor(index);
    process.removeListener("uncaughtException", onUncaughtException);
    process.removeListener("SIGINT", onSigint);
  }
};

process.exitCode = await main(argv.slice(2));

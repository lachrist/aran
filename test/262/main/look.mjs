import { cleanup, record } from "../record/index.mjs";
import { stdout, stderr, argv } from "node:process";
import { loadCursor } from "./cursor.mjs";
import { inspectErrorMessage, inspectErrorName } from "../util/index.mjs";
import { TEST262, ROOT } from "../layout.mjs";
import { showTargetPath } from "../fetch.mjs";
import { compileStage, isStageName } from "../staging/index.mjs";
import { grabTestCase } from "../catalog/index.mjs";
import { inspect } from "node:util";
import { RECORD } from "./layout.mjs";
import { getStageName } from "./argv.mjs";

const { process } = globalThis;

/**
 * @type {(
 *   argv: string[],
 * ) => Promise<number>}
 */
const main = async (argv) => {
  const stage = getStageName(argv);
  if (stage === null) {
    stderr.write(
      "usage: node --experimental-vm-modules --expose-gc test/262/look.mjs <stage>\n",
    );
    return 1;
  }
  if (!isStageName(stage)) {
    stderr.write(`invalid stage: ${stage}\n`);
    return 1;
  }
  const cursor = await loadCursor();
  const exec = await compileStage(stage, {
    memoization: "none",
    record: (file) => record(file, RECORD),
  });
  // It is unfortunate but uncaught exception do not necessarily indicate test failure.
  // test262/test/language/expressions/dynamic-import/syntax/valid/nested-if-nested-imports.js
  // Uncaught >> Error: ENOENT: no such file or directory, open
  //   'test262/test/language/expressions/dynamic-import/syntax/valid/[object Promise]'
  process.on("uncaughtException", (error, _origin) => {
    stderr.write(
      `uncaught >> ${inspectErrorName(error)} >> ${inspectErrorMessage(error)}\n`,
    );
    stderr.write(
      `${inspect(error, { showHidden: true, depth: null, colors: true })}\n`,
    );
  });
  await cleanup(RECORD);
  const test = await grabTestCase(cursor);
  stdout.write(`STAGE >> ${stage}\n`);
  stdout.write(`INDEX >> ${cursor}\n`);
  stdout.write(`PATH  >> ${showTargetPath(test.path, TEST262, ROOT)}\n`);
  stdout.write(
    inspect({ test, result: await exec(test) }, { depth: null, colors: true }),
  );
  return 0;
};

process.exitCode = await main(argv.slice(2));

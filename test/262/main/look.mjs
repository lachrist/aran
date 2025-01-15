/* eslint-disable local/strict-console */

import { cleanup, record } from "../record/index.mjs";
import { pathToFileURL } from "node:url";
import { stdout, stderr, argv } from "node:process";
import { parseCursor } from "./cursor.mjs";
import { inspectErrorMessage, inspectErrorName } from "../util/index.mjs";
import { readFile } from "node:fs/promises";
import { home, root } from "../layout.mjs";
import { showTargetPath } from "../fetch.mjs";
import { compileStage } from "../staging/index.mjs";
import { grabTestCase } from "../catalog/index.mjs";
import { inspect } from "node:util";
import { RECORD } from "./layout.mjs";

const { process } = globalThis;

/**
 * @type {(
 *   argv: string[],
 * ) => Promise<number>}
 */
const main = async (argv) => {
  const cursor = parseCursor(await readFile(pathToFileURL(argv[0]), "utf-8"));
  const exec = await compileStage(cursor.stage, {
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
  const test = await grabTestCase(cursor.index);
  stdout.write(`STAGE >> ${cursor.stage}\n`);
  stdout.write(`INDEX >> ${cursor.index}\n`);
  stdout.write(`PATH  >> ${showTargetPath(test.path, home, root)}\n`);
  stdout.write(
    inspect({ test, result: await exec(test) }, { depth: null, colors: true }),
  );
  return 0;
};

process.exitCode = await main(argv.slice(2));

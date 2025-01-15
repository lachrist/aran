/* eslint-disable local/strict-console */

import { cleanup, record } from "../record/index.mjs";
import { pathToFileURL } from "node:url";
import { argv } from "node:process";
import { parseCursor } from "./cursor.mjs";
import { inspectErrorMessage, inspectErrorName } from "../util/index.mjs";
import { readFile } from "node:fs/promises";
import { home, root } from "../layout.mjs";
import { showTargetPath } from "../fetch.mjs";
import { compileStage } from "../staging/index.mjs";
import { grabTestCase } from "../catalog/index.mjs";

const { console, process, URL } = globalThis;

const directory = new URL("record/", import.meta.url);

const cursor = parseCursor(await readFile(pathToFileURL(argv[2]), "utf8"));

const exec = await compileStage(cursor.stage, {
  memoization: "none",
  record: (file) => record(file, directory),
});

// It is unfortunate but uncaught exception do not necessarily indicate test failure.
// test262/test/language/expressions/dynamic-import/syntax/valid/nested-if-nested-imports.js
// Uncaught >> Error: ENOENT: no such file or directory, open
//   'test262/test/language/expressions/dynamic-import/syntax/valid/[object Promise]'
process.on("uncaughtException", (error, _origin) => {
  console.log(
    `uncaught >> ${inspectErrorName(error)} >> ${inspectErrorMessage(error)}`,
  );
  console.dir(error);
});

await cleanup(directory);

const test = await grabTestCase(cursor.index);

console.log(`===== ${cursor.stage} =====`);
console.log(`\n${showTargetPath(test.path, home, root)}\n`);
console.dir(await exec(test));

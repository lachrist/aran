/* eslint-disable local/strict-console */

import { cleanup, record } from "../record/index.mjs";
import { pathToFileURL } from "node:url";
import { argv } from "node:process";
import { parseCursor } from "./cursor.mjs";
import {
  scrape,
  inspectErrorMessage,
  inspectErrorName,
} from "../util/index.mjs";
import { readFile } from "node:fs/promises";
import { home, root } from "../home.mjs";
import { showTargetPath, toTestPath } from "../fetch.mjs";
import { compileStage } from "../staging/index.mjs";

const { console, process, URL, Error, JSON } = globalThis;

const directory = new URL("record/", import.meta.url);

/**
 * @type {(
 *   index: number
 * ) => Promise<import("../fetch").TestPath>}
 */
const findTestPath = async (index) => {
  let current = -1;
  for await (const url of scrape(new URL("test/", home))) {
    const path = toTestPath(url, home);
    if (path !== null) {
      current += 1;
      if (index === current) {
        return path;
      }
    }
  }
  throw new Error(`Index ${index} not found`);
};

/**
 * @type {(
 *   cursor: import("./cursor").Cursor,
 * ) => Promise<import("../fetch").TestPath>}
 */
const fetchTestPath = async (cursor) => {
  if (cursor.path === null) {
    if (cursor.index === null) {
      throw new Error(
        `Nothing to investigate from cursor: ${JSON.stringify(cursor)}`,
      );
    } else {
      return await findTestPath(cursor.index);
    }
  } else {
    return cursor.path;
  }
};

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

const path = await fetchTestPath(cursor);

console.log(`===== ${cursor.stage} =====`);
console.log(`\n${showTargetPath(path, home, root)}\n`);
console.dir(await exec(path));

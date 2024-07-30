/* eslint-disable local/strict-console */

import { isTestCase, runTest } from "./test.mjs";
import { cleanup, record } from "./record.mjs";
import { pathToFileURL } from "node:url";
import { argv } from "node:process";
import { parseCursor } from "./cursor.mjs";
import { scrape } from "./scrape.mjs";
import { readFile } from "node:fs/promises";
import { home, toRelative, toTarget } from "./home.mjs";
import { inspectErrorMessage, inspectErrorName } from "./error-serial.mjs";

const { console, process, URL, Error, JSON } = globalThis;

/**
 * @type {(
 *   index: number
 * ) => Promise<string>}
 */
const findTarget = async (index) => {
  let current = -1;
  for await (const url of scrape(new URL("test/", home))) {
    if (isTestCase(toTarget(url))) {
      current += 1;
      if (index === current) {
        return toTarget(url);
      }
    }
  }
  throw new Error(`Index ${index} not found`);
};

/**
 * @type {(
 *   cursor: import("./cursor").Cursor,
 * ) => Promise<string>}
 */
const fetchTarget = async (cursor) => {
  if (cursor.target === null) {
    if (cursor.index === null) {
      throw new Error(
        `Nothing to investigate from cursor: ${JSON.stringify(cursor)}`,
      );
    } else {
      return await findTarget(cursor.index);
    }
  } else {
    return cursor.target;
  }
};

const cursor = parseCursor(await readFile(pathToFileURL(argv[2]), "utf8"));

const codebase = new URL("codebase", import.meta.url);

const { compileInstrument } =
  await /** @type {{default: import("./stage").Stage}} */ (
    await import(`./stages/${cursor.stage}.mjs`)
  ).default(cursor.argv);

// It is unfortunate but uncaught exception do not necessarily indicate test failure.
// test262/test/language/expressions/dynamic-import/syntax/valid/nested-if-nested-imports.js
// Uncaught >> Error: ENOENT: no such file or directory, open
//   'test262/test/language/expressions/dynamic-import/syntax/valid/[object Promise]'
process.on("uncaughtException", (error, _origin) => {
  console.log(error);
  console.log(
    `Uncaught >> ${inspectErrorName(error)}: ${inspectErrorMessage(error)}`,
  );
});

await cleanup(codebase);

const target = await fetchTarget(cursor);

console.log(`===== ${cursor.stage} =====`);
console.log(`\n${toRelative(target)}\n`);
console.dir(
  await runTest({
    target,
    home,
    warning: "console",
    record,
    compileInstrument,
  }),
);

/* eslint-disable local/strict-console */

import { runTest } from "./test.mjs";
import { cleanup, record } from "./record.mjs";
import { pathToFileURL } from "node:url";
import { argv } from "node:process";
import { parseCursor } from "./cursor.mjs";
import { scrape } from "./scrape.mjs";
import { readFile } from "node:fs/promises";
import { home, root } from "./home.mjs";
import { inspectErrorMessage, inspectErrorName } from "./error-serial.mjs";
import {
  compileFetchHarness,
  compileFetchTarget,
  resolveDependency,
  showTargetPath,
  toMainPath,
} from "./fetch.mjs";
import { AranTypeError } from "./error.mjs";

const { console, process, URL, Error, JSON } = globalThis;

/**
 * @type {(
 *   index: number
 * ) => Promise<import("./fetch").MainPath>}
 */
const findMainPath = async (index) => {
  let current = -1;
  for await (const url of scrape(new URL("test/", home))) {
    const path = toMainPath(url, home);
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
 * ) => Promise<import("./fetch").MainPath>}
 */
const fetchMainPath = async (cursor) => {
  if (cursor.path === null) {
    if (cursor.index === null) {
      throw new Error(
        `Nothing to investigate from cursor: ${JSON.stringify(cursor)}`,
      );
    } else {
      return await findMainPath(cursor.index);
    }
  } else {
    return cursor.path;
  }
};

const cursor = parseCursor(await readFile(pathToFileURL(argv[2]), "utf8"));

const codebase = new URL("codebase", import.meta.url);

const { setup, instrument } =
  /** @type {{default: import("./stage").Stage}} */ (
    await import(`./stages/${cursor.stage}.mjs`)
  ).default;

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

const path = await fetchMainPath(cursor);

console.log(`===== ${cursor.stage} =====`);
console.log(`\n${showTargetPath(path, home, root)}\n`);
console.dir(
  await runTest(path, {
    setup,
    instrument: (source) => {
      const outcome = instrument(source);
      if (outcome.type === "failure") {
        return outcome;
      } else if (outcome.type === "success") {
        return {
          type: "success",
          data: record(source.kind, source.path, outcome.data.content),
        };
      } else {
        throw new AranTypeError(outcome);
      }
    },
    resolveDependency,
    fetchHarness: compileFetchHarness(home),
    fetchTarget: compileFetchTarget(home),
  }),
);

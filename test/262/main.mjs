/* eslint-disable no-console */

import { createWriteStream } from "node:fs";
import { readFile } from "node:fs/promises";
import { batch } from "./batch.mjs";
import { report } from "./report.mjs";
import { getRelative, isFailure, parseResultDump } from "./result.mjs";

const { process, URL, Set, Promise } = globalThis;

process.on("uncaughtException", (error, origin) => {
  console.dir({ origin, error });
});

const test262 = new URL("../../test262/", import.meta.url);

const name = process.argv[2];

const {
  default: { requirements, instrumenter, filtering },
} = /** @type {{default: test262.Stage}} */ (
  await import(`./stages/${name}.mjs`)
);

/** @type {(name: string) => Promise<string[]>} => */
const listPreviousFailure = async (name) =>
  parseResultDump(
    await readFile(new URL(`stages/${name}.jsonlist`, import.meta.url), "utf8"),
  )
    .filter(isFailure)
    .map(getRelative);

const exclusion = new Set(
  (await Promise.all(requirements.map(listPreviousFailure))).flat(),
);

const dump = new URL(`stages/${name}.jsonlist`, import.meta.url);

const writable = createWriteStream(dump);

await batch({
  test262,
  isExcluded: (relative) => exclusion.has(relative),
  writable,
  instrumenter,
});

await new Promise((resolve) => {
  writable.end(resolve);
});

console.log(report(await readFile(dump, "utf8"), filtering));

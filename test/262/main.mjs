/* eslint-disable no-console */

import { createWriteStream } from "node:fs";
import { readFile } from "node:fs/promises";
import { batch } from "./batch.mjs";
import { report } from "./report.mjs";
import { getTarget, isFailure, parseResultDump } from "./result.mjs";

const { Error, process, URL, Set, Promise } = globalThis;

if (!process.execArgv.includes("--experimental-vm-modules")) {
  throw new Error("missing --experimental-vm-modules flag");
}

if (process.argv.length !== 3) {
  throw new Error("usage: node test/262/main.mjs <stage>");
}

const [_exec, _main, stage] = process.argv;

process.on("uncaughtException", (error, origin) => {
  console.dir({ origin, error });
});

const test262 = new URL("../../test262/", import.meta.url);

const {
  default: { requirements, filtering, makeInstrumenter },
} = /** @type {{default: test262.Stage}} */ (
  await import(`./stages/${stage}.mjs`)
);

/** @type {(stage: string) => Promise<string[]>} => */
const listPreviousFailure = async (stage) =>
  parseResultDump(
    await readFile(
      new URL(`stages/${stage}.jsonlist`, import.meta.url),
      "utf8",
    ),
  )
    .filter(isFailure)
    .map(getTarget);

const exclusion = new Set(
  (await Promise.all(requirements.map(listPreviousFailure))).flat(),
);

const dump = new URL(`stages/${stage}.jsonlist`, import.meta.url);

const writable = createWriteStream(dump);

await batch({
  test262,
  isExcluded: (relative) => exclusion.has(relative),
  writable,
  makeInstrumenter,
});

await new Promise((resolve) => {
  writable.end(resolve);
});

console.log(report(await readFile(dump, "utf8"), filtering));

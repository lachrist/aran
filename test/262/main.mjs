/* eslint-disable no-console */

import { createWriteStream } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { batch } from "./batch.mjs";
import { report } from "./report.mjs";

const { Set, Error, process, URL, Promise } = globalThis;

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
  default: { exclusion, filtering, makeInstrumenter },
} = /** @type {{default: test262.Stage}} */ (
  await import(`./stages/${stage}.mjs`)
);

const excluded = new Set(exclusion);

const dump = new URL(`stages/${stage}.jsonlist`, import.meta.url);

const writable = createWriteStream(dump);

await batch({
  test262,
  isExcluded: (relative) => excluded.has(relative),
  writable,
  makeInstrumenter,
});

await new Promise((resolve) => {
  writable.end(resolve);
});

const summary = report(await readFile(dump, "utf8"), filtering);

console.log(summary);

await writeFile(
  new URL(`stages/summary.txt`, import.meta.url),
  summary,
  "utf8",
);

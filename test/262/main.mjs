/* eslint-disable no-console */

import { createWriteStream } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { batch } from "./batch.mjs";
import { report } from "./report.mjs";

const { parseInt, Set, Error, process, URL, Promise } = globalThis;

if (!process.execArgv.includes("--experimental-vm-modules")) {
  throw new Error("missing --experimental-vm-modules flag");
}

if (process.argv.length !== 3 && process.argv.length !== 4) {
  throw new Error("usage: node test/262/main.mjs <stage> [initial]");
}

const [_exec, _main, stage, initial = "0"] = process.argv;

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

const writable = createWriteStream(dump, { flags: "a", encoding: "utf8" });

console.dir(
  await batch({
    initial: parseInt(initial),
    test262,
    isExcluded: (relative) => excluded.has(relative),
    writable,
    makeInstrumenter,
  }),
);

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

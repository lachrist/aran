/* eslint-disable no-console */

import { createWriteStream } from "node:fs";
import { readFile } from "node:fs/promises";
import { batch } from "./batch.mjs";
import { report } from "./report.mjs";

const { Error, process, URL, Promise } = globalThis;

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
  default: { tagResult, makeInstrumenter },
} = /** @type {{default: test262.Stage}} */ (
  await import(`./stages/${stage}.mjs`)
);

const dump = new URL(`stages/${stage}.jsonlist`, import.meta.url);

const writable = createWriteStream(dump, { flags: "w", encoding: "utf8" });

await batch({
  test262,
  writable,
  makeInstrumenter,
});

await new Promise((resolve) => {
  writable.end(resolve);
});

console.log(report(await readFile(dump, "utf8"), tagResult));

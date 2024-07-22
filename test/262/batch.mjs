/* eslint-disable local/strict-console */

import { writeFile } from "node:fs/promises";
import { scrape } from "./scrape.mjs";
import { argv } from "node:process";
import { isTestCase, runTest } from "./test.mjs";
import { inspectError } from "./util.mjs";
import { isFailureResult } from "./result.mjs";
import { stringifyFailureArray } from "./failure.mjs";
import { home, toTarget } from "./home.mjs";

const { Error, console, process, URL } = globalThis;

if (process.argv.length !== 3) {
  throw new Error(
    "usage: node --experimental-vm-modules --expose-gc test/262/batch.mjs <stage>",
  );
}

const stage = argv[2];

const {
  default: { compileInstrument, predictStatus, isExcluded, listCause },
} = /** @type {{default: import("./types").Stage}} */ (
  await import(`./stages/${stage}.mjs`)
);

process.on("uncaughtException", (error, _origin) => {
  const { name, message } = inspectError(error);
  console.log(`${name}: ${message}`);
});

/** @type {import("./types").Failure[]} */
const failures = [];

let index = 0;

for await (const url of scrape(new URL("test/", home))) {
  if (index % 100 === 0) {
    console.dir(index);
  }
  const target = toTarget(url);
  if (isTestCase(target) && !isExcluded(target)) {
    const result = await runTest({
      target,
      home,
      record: (source) => source,
      warning: "ignore",
      compileInstrument,
    });
    const status = predictStatus(target);
    if (isFailureResult(result)) {
      failures.push({ target, causes: listCause(result) });
    } else if (status === "negative") {
      failures.push({
        target,
        causes: ["expected negative but got positive instead"],
      });
    }
  }
  index += 1;
}

await writeFile(
  new URL(`stages/${stage}.failure.txt`, import.meta.url),
  stringifyFailureArray(failures),
  "utf8",
);

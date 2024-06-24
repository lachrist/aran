/* eslint-disable local/strict-console */

import { writeFile } from "node:fs/promises";
import { scrape } from "./scrape.mjs";
import { argv } from "node:process";
import { isTestCase, runTest } from "./test.mjs";
import { inspectError } from "./util.mjs";
import { isFailureResult } from "./result.mjs";

const { Error, console, process, URL, JSON } = globalThis;

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

const test262 = new URL("../../test262/", import.meta.url);

/** @type {[string, string[]][]} */
const failures = [];

let index = 0;

for await (const url of scrape(new URL("test/", test262))) {
  if (index % 100 === 0) {
    console.dir(index);
  }
  const target = url.href.substring(test262.href.length);
  if (isTestCase(target) && !isExcluded(target)) {
    const result = await runTest({
      target,
      test262,
      record: (source) => source,
      warning: "ignore",
      compileInstrument,
    });
    const status = predictStatus(target);
    if (isFailureResult(result)) {
      failures.push([target, listCause(result)]);
    } else if (status === "negative") {
      failures.push([target, ["expected negative but got positive instead"]]);
    }
  }
  index += 1;
}

await writeFile(
  new URL(`stages/${stage}.failure.json`, import.meta.url),
  JSON.stringify(failures, null, 2),
  "utf8",
);

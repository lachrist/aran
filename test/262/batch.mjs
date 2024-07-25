/* eslint-disable local/strict-console */

import { writeFile } from "node:fs/promises";
import { scrape } from "./scrape.mjs";
import { argv } from "node:process";
import { isTestCase, runTest } from "./test.mjs";
import { inspectError } from "./util.mjs";
import { stringifyFailureArray } from "./failure.mjs";
import { home, toTarget } from "./home.mjs";
import { AranTypeError } from "./error.mjs";

const { Error, console, process, URL } = globalThis;

if (process.argv.length < 3) {
  throw new Error(
    "usage: node --experimental-vm-modules --expose-gc test/262/batch.mjs <stage> [...argv]",
  );
}

const [_node, _main, stage, ...argv2] = argv;

const { compileInstrument, predictStatus, isExcluded, listCause } =
  /** @type {{default: import("./types").Stage}} */ (
    await import(`./stages/${stage}.mjs`)
  ).default(argv2);

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
    const { metadata, outcome } = await runTest({
      target,
      home,
      record: (source) => source,
      warning: "ignore",
      compileInstrument,
    });
    const status = predictStatus(target);
    if (outcome.type === "success") {
      if (status === "negative") {
        failures.push({
          target,
          causes: ["expected negative but got positive instead"],
        });
      }
    } else if (outcome.type === "failure-meta") {
      failures.push({ target, causes: outcome.data });
    } else if (outcome.type === "failure-base") {
      failures.push({
        target,
        causes: listCause({ target, metadata, outcome }),
      });
    } else {
      throw new AranTypeError(outcome);
    }
  }
  index += 1;
}

await writeFile(
  new URL(`stages/${stage}.failure.txt`, import.meta.url),
  stringifyFailureArray(failures),
  "utf8",
);

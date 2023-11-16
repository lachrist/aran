/* eslint-disable local/strict-console */

import { readFile, writeFile } from "node:fs/promises";
import { scrape } from "./scrape.mjs";
import { argv } from "node:process";
import { runTest } from "./test.mjs";
import { inspectError } from "./util.mjs";
import { isFailure } from "./result.mjs";

const {
  Error,
  Promise,
  Map,
  Object,
  Reflect,
  console,
  process,
  URL,
  Set,
  JSON,
} = globalThis;

if (process.argv.length !== 3) {
  throw new Error("usage: node test/262/batch.mjs <stage>");
}

const stage = argv[2];

const {
  default: { createInstrumenter, tagFailure, requirement },
} = /** @type {{default: test262.Stage}} */ (
  await import(`./stages/${stage}.mjs`)
);

process.on("uncaughtException", (error, _origin) => {
  const { name, message } = inspectError(error);
  console.log(`${name}: ${message}`);
});

const test262 = new URL("../../test262/", import.meta.url);

/** @type {Set<string>} */
const exclusion = new Set(
  (
    await Promise.all(
      requirement.map((stage) =>
        readFile(new URL(`stages/${stage}.json`, import.meta.url), "utf8"),
      ),
    )
  ).flatMap(
    (content) => /** @type {string[]} */ (Reflect.ownKeys(JSON.parse(content))),
  ),
);

/** @type {Map<string, string[]>} */
const failures = new Map();

let index = 0;

for await (const url of scrape(new URL("test/", test262))) {
  if (index % 100 === 0) {
    console.dir(index);
  }
  const target = url.href.substring(test262.href.length);
  if (!target.includes("_FIXTURE") && !exclusion.has(target)) {
    const result = await runTest({
      target,
      test262,
      warning: "silent",
      createInstrumenter,
    });
    if (isFailure(result)) {
      failures.set(target, tagFailure(result));
    }
  }
  index += 1;
}

await writeFile(
  new URL(`stages/${stage}.json`, import.meta.url),
  JSON.stringify(Object.fromEntries(failures.entries()), null, 2),
  "utf8",
);

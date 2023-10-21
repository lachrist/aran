/* eslint-disable local/strict-console */

import { readFile } from "node:fs/promises";
import { argv } from "node:process";
import { cleanup, recordInstrumentation } from "./record.mjs";
import { scrape } from "./scrape.mjs";
import { runTest } from "./test.mjs";
import { inspectError } from "./util.mjs";
import { isFailure } from "./result.mjs";

const { Reflect, JSON, Set, Promise, parseInt, Error, console, process, URL } =
  globalThis;

if (process.argv.length !== 4) {
  throw new Error("usage: node test/262/batch.mjs <stage> <initial>");
}

const stage = argv[2];

const initial = parseInt(argv[3]);

const test262 = new URL("../../test262/", import.meta.url);

const codebase = new URL("codebase", import.meta.url);

const {
  default: { instrumenter, tagFailure, requirement },
} = /** @type {{default: test262.Stage}} */ (
  await import(`./stages/${stage}.mjs`)
);

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

process.on("uncaughtException", (error, _origin) => {
  const { name, message } = inspectError(error);
  console.log(`${name}: ${message}`);
});

let index = 0;

for await (const url of scrape(new URL("test/", test262))) {
  if (index >= initial) {
    console.dir(index);
    const target = url.href.substring(test262.href.length);
    if (!target.includes("_FIXTURE") && !exclusion.has(target)) {
      const result = await runTest({
        target,
        test262,
        instrumenter,
      });
      if (isFailure(result) && tagFailure(result).length === 0) {
        await cleanup(codebase);
        console.dir(`test262/${target}`);
        const { setup, globals, instrument } = instrumenter;
        console.dir(
          await runTest({
            target,
            test262,
            instrumenter: {
              setup,
              globals,
              instrument: (code, { kind, specifier }) =>
                recordInstrumentation({
                  directory: codebase,
                  original: code,
                  instrumented: instrument(code, { kind, specifier }),
                  kind,
                  specifier,
                }),
            },
          }),
        );
        // eslint-disable-next-line local/no-label
        break;
      }
    }
  }
  index += 1;
}

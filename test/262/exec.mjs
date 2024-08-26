/* eslint-disable local/strict-console */

import { writeFile } from "node:fs/promises";
import { scrape } from "./scrape.mjs";
import { argv } from "node:process";
import { isTestCase, runTest } from "./test.mjs";
import { home, toTarget } from "./home.mjs";
import { inspectErrorMessage, inspectErrorName } from "./error-serial.mjs";
import { listTag, loadTagging } from "./tagging.mjs";
import { listPrecursor, loadPrecursor } from "./precursor.mjs";
import { parseArgv, toBasename } from "./argv.mjs";

const { Error, console, process, URL, JSON } = globalThis;

if (argv.length < 3) {
  throw new Error(
    "usage: node --experimental-vm-modules --expose-gc test/262/batch.mjs <stage> [...argv]",
  );
}

const [_node, _main, stage_name, ...stage_argv] = argv;

const options = parseArgv(stage_argv);

const stage = await /** @type {{default: import("./stage").Stage}} */ (
  await import(`./stages/${stage_name}.mjs`)
).default(options);

process.on("uncaughtException", (error, _origin) => {
  console.log(`${inspectErrorName(error)}: ${inspectErrorMessage(error)}`);
});

const precursor = await loadPrecursor(stage.precursor);

const exclude = await loadTagging(stage.exclude);

const negative = await loadTagging(stage.negative);

/** @type {import("./result").Result[]} */
const results = [];

let index = 0;

for await (const url of scrape(new URL("test/", home))) {
  if (index % 100 === 0) {
    console.dir(index);
  }
  const target = toTarget(url);
  if (isTestCase(target)) {
    if (listPrecursor(precursor, target).length === 0) {
      const tags = listTag(exclude, target);
      if (tags.length === 0) {
        const { metadata, error } = await runTest({
          target,
          home,
          record: (source) => source,
          warning: "ignore",
          compileInstrument: stage.compileInstrument,
        });
        const tags = [
          ...listTag(negative, target),
          ...(error === null
            ? []
            : stage.listLateNegative(target, metadata, error)),
        ];
        if (error !== null) {
          results.push({
            type: "include",
            path: target,
            expect: tags,
            actual: {
              ...error,
              stack: null,
            },
          });
        } else if (tags.length > 0) {
          results.push({
            type: "include",
            path: target,
            expect: tags,
            actual: null,
          });
        }
      } else {
        results.push({
          type: "exclude",
          path: target,
          tags,
        });
      }
    }
  }
  index += 1;
}

await writeFile(
  new URL(`stages/${stage_name}${toBasename(options)}.json`, import.meta.url),
  JSON.stringify(results, null, 2),
  "utf8",
);

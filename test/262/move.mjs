/* eslint-disable local/strict-console */

import { pathToFileURL } from "node:url";
import { argv } from "node:process";
import { scrape } from "./scrape.mjs";
import { isTestCase, runTest } from "./test.mjs";
import { parseCursor, stringifyCursor } from "./cursor.mjs";
import { readFile } from "node:fs/promises";
import { writeFileSync } from "node:fs";
import { home, toRelative, toTarget } from "./home.mjs";
import { listTag, loadTagging } from "./tagging.mjs";
import { inspectErrorMessage, inspectErrorName } from "./error-serial.mjs";
import { listPrecursor, loadPrecursor } from "./precursor.mjs";

const { console, process, URL } = globalThis;

const persistent = pathToFileURL(argv[2]);

const cursor = parseCursor(await readFile(persistent, "utf8"));

const stage = await /** @type {{default: import("./stage").Stage}} */ (
  await import(`./stages/${cursor.stage}.mjs`)
).default(cursor.argv);

const precursor = await loadPrecursor(stage.precursor);

const negative = await loadTagging(stage.negative);

const exclude = await loadTagging(stage.exclude);

let index = 0;

/** @type {string | null} */
let target = null;

let ongoing = false;

process.on("uncaughtException", (error, _origin) => {
  console.log(error);
  console.log(
    `Uncaught >> ${inspectErrorName(error)}: ${inspectErrorMessage(error)}`,
  );
});

process.on("SIGINT", () => {
  process.exit(0);
});

process.on("exit", () => {
  if (ongoing) {
    writeFileSync(
      persistent,
      stringifyCursor({
        stage: cursor.stage,
        argv: cursor.argv,
        index,
        target,
      }),
      "utf8",
    );
  }
});

for await (const url of scrape(new URL("test/", home))) {
  target = toTarget(url);
  if (isTestCase(target)) {
    if ((!ongoing && target === cursor.target) || index === cursor.index) {
      ongoing = true;
    }
    if (ongoing) {
      if (
        listTag(exclude, target).length === 0 &&
        listPrecursor(precursor, target).length === 0
      ) {
        console.log(index, toRelative(target));
        const { metadata, error } = await runTest({
          target,
          home,
          warning: "ignore",
          record: (source) => source,
          compileInstrument: stage.compileInstrument,
        });
        const tags = [
          ...listTag(negative, target),
          ...(error === null
            ? []
            : stage.listLateNegative(target, metadata, error)),
        ];
        if ((tags.length === 0) !== (error === null)) {
          console.log({
            tags,
            error,
          });
          process.exit(1);
        }
      }
    }
    index += 1;
  }
}

writeFileSync(
  persistent,
  stringifyCursor({
    stage: cursor.stage,
    argv: cursor.argv,
    index: null,
    target: null,
  }),
  "utf8",
);

ongoing = false;

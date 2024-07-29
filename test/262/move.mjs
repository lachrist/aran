/* eslint-disable local/strict-console */

import { pathToFileURL } from "node:url";
import { argv } from "node:process";
import { scrape } from "./scrape.mjs";
import { isTestCase, runTest } from "./test.mjs";
import { inspectError } from "./util.mjs";
import { parseCursor, stringifyCursor } from "./cursor.mjs";
import { readFile } from "node:fs/promises";
import { writeFileSync } from "node:fs";
import { home, toRelative, toTarget } from "./home.mjs";

const { Object, console, process, URL } = globalThis;

const persistent = pathToFileURL(argv[2]);

const cursor = parseCursor(await readFile(persistent, "utf8"));

const { compileInstrument, predictStatus, isExcluded, listCause } =
  await /** @type {{default: import("./types").Stage}} */ (
    await import(`./stages/${cursor.stage}.mjs`)
  ).default(cursor.argv);

/** @type {(error: import("./types").ErrorSerial) => string} */
const printError = (error) =>
  Object.hasOwn(error, "stack")
    ? /** @type {string} */ (error.stack)
    : `${error.name}: ${error.message}`;

let index = 0;

/** @type {string | null} */
let target = null;

let ongoing = false;

process.on("uncaughtException", (error, _origin) => {
  console.log(error);
  const { name, message } = inspectError(error);
  console.log(`Uncaught >> ${name}: ${message}`);
});

const saveProgress = () => {
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
};

process.on("SIGINT", () => {
  process.exit(0);
});

process.on("exit", saveProgress);

for await (const url of scrape(new URL("test/", home))) {
  target = toTarget(url);
  if (isTestCase(target)) {
    if ((!ongoing && target === cursor.target) || index === cursor.index) {
      ongoing = true;
    }
    if (ongoing) {
      if (!isExcluded(target)) {
        console.log(index, toRelative(target));
        const { metadata, outcome } = await runTest({
          target,
          home,
          warning: "ignore",
          record: (source) => source,
          compileInstrument,
        });
        const status = predictStatus(target);
        if (outcome.type === "success") {
          if (status === "negative") {
            console.log("");
            console.log("Expected failure but got success, yay... (I guess)\n");
            process.exit(0);
          }
        } else if (
          outcome.type === "failure-meta" ||
          outcome.type === "failure-base"
        ) {
          if (status === "positive") {
            const causes = listCause({ target, metadata, outcome });
            if (causes.length === 0) {
              console.log(printError(outcome.data));
              process.exit(0);
            } else {
              for (const cause of causes) {
                console.log(`  >> ${cause}`);
              }
            }
          }
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

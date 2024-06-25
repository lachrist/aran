/* eslint-disable local/strict-console */

import { pathToFileURL } from "node:url";
import { argv } from "node:process";
import { scrape } from "./scrape.mjs";
import { isTestCase, runTest } from "./test.mjs";
import { inspectError } from "./util.mjs";
import { parseCursor, stringifyCursor } from "./cursor.mjs";
import { isFailureResult } from "./result.mjs";
import { readFile } from "node:fs/promises";
import { writeFileSync } from "node:fs";

const { Object, console, process, URL } = globalThis;

const persistent = pathToFileURL(argv[2]);

const { stage, index: initial } = parseCursor(
  await readFile(persistent, "utf8"),
);

const test262 = new URL("../../test262/", import.meta.url);

const {
  default: { compileInstrument, predictStatus, isExcluded, listCause },
} = /** @type {{default: import("./types").Stage}} */ (
  await import(`./stages/${stage}.mjs`)
);

/** @type {(error: import("./types").ErrorSerial) => string} */
const printError = (error) =>
  Object.hasOwn(error, "stack")
    ? /** @type {string} */ (error.stack)
    : `${error.name}: ${error.message}`;

let index = 0;

process.on("uncaughtException", (error, _origin) => {
  console.log(error);
  const { name, message } = inspectError(error);
  console.log(`Uncaught >> ${name}: ${message}`);
});

const saveProgress = () => {
  if (index > initial) {
    writeFileSync(persistent, stringifyCursor({ stage, index }), "utf8");
  }
};

process.on("SIGINT", () => {
  process.exit(0);
});

process.on("exit", saveProgress);

for await (const url of scrape(new URL("test/", test262))) {
  const target = url.href.substring(test262.href.length);
  if (index >= initial) {
    if (isTestCase(target) && !isExcluded(target)) {
      console.log(index, `test262/${target}`);
      const result = await runTest({
        target,
        test262,
        warning: "ignore",
        record: (source) => source,
        compileInstrument,
      });
      const status = predictStatus(target);
      if (status === "positive" && isFailureResult(result)) {
        const causes = listCause(result);
        if (causes.length === 0) {
          console.log(printError(result.error));
          process.exit(0);
        } else {
          for (const cause of causes) {
            console.log(`  >> ${cause}`);
          }
        }
      }
      if (status === "negative" && result.error === null) {
        console.log("");
        console.log("Expected failure but got success, yay... (I guess)\n");
        process.exit(0);
      }
    }
  }
  index += 1;
}

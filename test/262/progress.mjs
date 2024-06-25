/* eslint-disable local/strict-console */

import { pathToFileURL } from "node:url";
import { argv } from "node:process";
import { cleanup, record } from "./record.mjs";
import { scrape } from "./scrape.mjs";
import { isTestCase, runTest } from "./test.mjs";
import { inspectError } from "./util.mjs";
import { loadCursor, saveCursor } from "./cursor.mjs";
import { isFailureResult } from "./result.mjs";

const { Object, console, process, URL } = globalThis;

const persistent = pathToFileURL(argv[2]);

const cursor = await loadCursor(persistent);

const test262 = new URL("../../test262/", import.meta.url);

const codebase = new URL("codebase/", import.meta.url);

const {
  default: { compileInstrument, predictStatus, isExcluded, listCause },
} = /** @type {{default: import("./types").Stage}} */ (
  await import(`./stages/${cursor.stage}.mjs`)
);

/** @type {(error: import("./types").ErrorSerial) => string} */
const printError = (error) =>
  Object.hasOwn(error, "stack")
    ? /** @type {string} */ (error.stack)
    : `${error.name}: ${error.message}`;

process.on("uncaughtException", (error, _origin) => {
  console.log(error);
  const { name, message } = inspectError(error);
  console.log(`Uncaught >> ${name}: ${message}`);
});

const initial = cursor.index;

cursor.index = 0;

try {
  for await (const url of scrape(new URL("test/", test262))) {
    const target = url.href.substring(test262.href.length);
    if (cursor.index >= initial) {
      if (isTestCase(target) && !isExcluded(target)) {
        console.log(cursor.index, `test262/${target}`);
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
            console.log("");
            await cleanup(codebase);
            const { error } = await runTest({
              target,
              test262,
              warning: "console",
              record,
              compileInstrument,
            });
            if (error === null) {
              console.log("** Error Disappeared **\n");
              console.log(printError(result.error));
            } else {
              console.log(printError(error));
            }
            // eslint-disable-next-line local/no-label
            break;
          } else {
            for (const cause of causes) {
              console.log(`  >> ${cause}`);
            }
          }
        }
        if (status === "negative" && result.error === null) {
          console.log("");
          console.log("Expected failure but got success, yay... (I guess)\n");
          // eslint-disable-next-line local/no-label
          break;
        }
      }
    }
    cursor.index += 1;
  }
} finally {
  await saveCursor(persistent, cursor);
}

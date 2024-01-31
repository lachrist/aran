/* eslint-disable local/strict-console */

import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { argv } from "node:process";
import { cleanup, record } from "./record.mjs";
import { scrape } from "./scrape.mjs";
import { runTest } from "./test.mjs";
import { inspectError } from "./util.mjs";
import { loadCursor, saveCursor } from "./cursor.mjs";

const { Object, Reflect, JSON, Set, Promise, console, process, URL } =
  globalThis;

const persistent = pathToFileURL(argv[2]);

const cursor = await loadCursor(persistent);

const test262 = new URL("../../test262/", import.meta.url);

const codebase = new URL("codebase/", import.meta.url);

const {
  default: {
    createInstrumenter,
    expect,
    requirement,
    exclusion: manual_exclusion,
  },
} = /** @type {{default: test262.Stage}} */ (
  await import(`./stages/${cursor.stage}.mjs`)
);

/** @type {Set<string>} */
const exclusion = new Set([
  ...manual_exclusion,
  ...(
    await Promise.all(
      requirement.map((stage) =>
        readFile(new URL(`stages/${stage}.json`, import.meta.url), "utf8"),
      ),
    )
  ).flatMap(
    (content) => /** @type {string[]} */ (Reflect.ownKeys(JSON.parse(content))),
  ),
]);

/** @type {(error: test262.ErrorSerial) => string} */
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

cursor.index = -1;

try {
  for await (const url of scrape(new URL("test/", test262))) {
    const target = url.href.substring(test262.href.length);
    cursor.index += 1;
    if (cursor.index >= initial) {
      console.log(cursor.index);
      if (!target.includes("_FIXTURE") && !exclusion.has(target)) {
        const result = await runTest({
          target,
          test262,
          warning: "silent",
          record: (source) => source,
          createInstrumenter,
        });
        const reasons = expect(result);
        if (result.error === null) {
          if (reasons.length > 0) {
            console.log(target, ">>", reasons);
            console.log("Expected failure but got success, yay... (I guess)");
            // eslint-disable-next-line local/no-label
            break;
          }
        } else {
          if (reasons.length > 0) {
            console.log(target, ">>", reasons);
          } else {
            console.log("\nTarget >>", JSON.stringify(target));
            console.log("\nLink >>", `test262/${target}`, "\n");
            await cleanup(codebase);
            const { error } = await runTest({
              target,
              test262,
              warning: "console",
              record,
              createInstrumenter,
            });
            if (error === null) {
              console.log("** Error Disappeared **");
              console.log(printError(result.error));
            } else {
              console.log(printError(error));
            }
            // eslint-disable-next-line local/no-label
            break;
          }
        }
      }
    }
  }
} finally {
  await saveCursor(persistent, cursor);
}

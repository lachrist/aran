/* eslint-disable local/strict-console */

import { readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { argv } from "node:process";
import { cleanup, record } from "./record.mjs";
import { scrape } from "./scrape.mjs";
import { runTest } from "./test.mjs";
import { inspectError } from "./util.mjs";
import { isFailure } from "./result.mjs";

const { Object, Reflect, JSON, Set, Promise, console, process, URL } =
  globalThis;

const persistent = pathToFileURL(argv[2]);

/** @type {(url: URL) => Promise<string | null>} */
const readFileMaybe = async (url) => {
  try {
    return await readFile(url, "utf8");
  } catch {
    return null;
  }
};

const { stage, initial } = JSON.parse(
  (await readFileMaybe(persistent)) ?? '{"stage": "identity", "initial": 0}',
);

const test262 = new URL("../../test262/", import.meta.url);

const codebase = new URL("codebase/", import.meta.url);

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

/** @type {(error: test262.ErrorSerial) => string} */
const printError = (error) =>
  Object.hasOwn(error, "stack")
    ? /** @type {string} */ (error.stack)
    : `${error.name}: ${error.message}`;

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
        await writeFile(
          persistent,
          JSON.stringify({ stage, target, initial: index }, null, 2),
          "utf8",
        );
        const { setup, globals, instrument } = instrumenter;
        await cleanup(codebase);
        const { metadata, error } = await runTest({
          target,
          test262,
          instrumenter: {
            setup,
            globals,
            instrument: (source) => record(instrument(source)),
          },
        });
        console.dir(`test262/${target}`);
        console.dir(metadata);
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
  index += 1;
}

/* eslint-disable local/strict-console */

import { writeFile, readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { argv } from "node:process";
import { cleanup, record } from "./record.mjs";
import { scrape } from "./scrape.mjs";
import { runTest } from "./test.mjs";
import { inspectError } from "./util.mjs";

const {
  Object,
  Reflect,
  JSON,
  Set,
  TypeError,
  Promise,
  console,
  process,
  URL,
} = globalThis;

const persistent = pathToFileURL(argv[2]);

/** @type {(url: URL) => Promise<string | null>} */
const readFileMaybe = async (url) => {
  try {
    return await readFile(url, "utf8");
  } catch {
    return null;
  }
};

/**
 * @type {(
 *   data: unknown
 * ) => data is import("./progress").Progress}
 */
const isProgress = (data) =>
  typeof data === "object" &&
  data !== null &&
  "stage" in data &&
  Object.hasOwn(data, "stage") &&
  typeof data.stage === "string" &&
  "target" in data &&
  Object.hasOwn(data, "target") &&
  (typeof data.target === "string" || data.target === null) &&
  "index" in data &&
  Object.hasOwn(data, "index") &&
  typeof data.index === "number";

/**
 * @type {(content: string) => import("./progress").Progress}
 */
const parseProgress = (content) => {
  const data = JSON.parse(content);
  if (isProgress(data)) {
    return data;
  } else {
    throw new TypeError("Invalid progress file");
  }
};

const progress = parseProgress(
  (await readFileMaybe(persistent)) ??
    '{"stage": "identity", "index": 0, "target": null}',
);

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
  await import(`./stages/${progress.stage}.mjs`)
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
  const { name, message } = inspectError(error);
  console.log(`Uncaught >> ${name}: ${message}`);
});

const initial = progress.index;

progress.index = -1;
progress.target = null;

try {
  for await (const url of scrape(new URL("test/", test262))) {
    const target = url.href.substring(test262.href.length);
    progress.index += 1;
    console.log(progress.index);
    progress.target = target;
    if (progress.index >= initial) {
      if (!target.includes("_FIXTURE") && !exclusion.has(target)) {
        const result = await runTest({
          target,
          test262,
          warning: "silent",
          createInstrumenter,
        });
        const reasons = expect(result);
        if (result.error !== null) {
          console.log(target, ">>", reasons);
        }
        if ((result.error === null) !== (reasons.length === 0)) {
          console.log(JSON.stringify(target));
          console.log(`test262/${target}`);
          console.dir(result.metadata);
          if (result.error) {
            await cleanup(codebase);
            const { error } = await runTest({
              target,
              test262,
              warning: "console",
              createInstrumenter: (reject) => {
                const { setup, globals, instrument } =
                  createInstrumenter(reject);
                return {
                  setup,
                  globals,
                  instrument: (source) => record(instrument(source)),
                };
              },
            });
            if (error === null) {
              console.log("** Error Disappeared **");
              console.log(printError(result.error));
            } else {
              console.log(printError(error));
            }
          } else {
            console.log("Expected failure but got success");
            console.dir(reasons);
          }
          // eslint-disable-next-line local/no-label
          break;
        }
      }
    }
  }
} finally {
  await writeFile(persistent, JSON.stringify(progress, null, 2), "utf8");
}

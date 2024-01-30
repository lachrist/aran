/* eslint-disable local/strict-console */

import { runTest } from "./test.mjs";
import { cleanup, record } from "./record.mjs";
import { pathToFileURL } from "node:url";
import { argv, stdout, exit } from "node:process";
import { loadCursor } from "./cursor.mjs";
import { scrape } from "./scrape.mjs";

const { console, URL, Error } = globalThis;

const {
  stage,
  index,
  target: maybe_target,
} = await loadCursor(pathToFileURL(argv[2]));

if (index === 0) {
  stdout.write("Nothing to investigate.\n");
  exit(0);
}

const test262 = new URL("../../test262/", import.meta.url);

const codebase = new URL("codebase", import.meta.url);

const {
  default: { createInstrumenter },
} = /** @type {{default: test262.Stage}} */ (
  await import(`./stages/${stage}.mjs`)
);

await cleanup(codebase);

/**
 * @type {(
 *   index: number
 * ) => Promise<string>}
 */
const findTarget = async (index) => {
  let current = 0;
  for await (const url of scrape(new URL("test/", test262))) {
    current += 1;
    if (index === current) {
      return url.href.substring(test262.href.length);
    }
  }
  throw new Error(`Index ${index} not found`);
};

const target = maybe_target ?? (await findTarget(index));

console.log(target);
console.dir(
  await runTest({
    target,
    test262,
    warning: "console",
    record,
    createInstrumenter,
  }),
);

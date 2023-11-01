/* eslint-disable local/strict-console */

import { runTest } from "./test.mjs";
import { cleanup, record } from "./record.mjs";
import { pathToFileURL } from "node:url";
import { argv } from "node:process";
import { readFile } from "node:fs/promises";

const { JSON, console, URL } = globalThis;

const { stage, target } = JSON.parse(
  await readFile(pathToFileURL(argv[2]), "utf8"),
);

const test262 = new URL("../../test262/", import.meta.url);

const codebase = new URL("codebase", import.meta.url);

const {
  default: {
    instrumenter: { setup, instrument, globals },
  },
} = /** @type {{default: test262.Stage}} */ (
  await import(`./stages/${stage}.mjs`)
);

await cleanup(codebase);

console.dir(
  await runTest({
    target,
    test262,
    instrumenter: {
      setup,
      globals,
      instrument: (source) => record(instrument(source)),
    },
  }),
);

/* eslint-disable local/strict-console */

import { runTest } from "./test.mjs";
import { cleanup, recordInstrumentation } from "./record.mjs";

const { console, Error, process, URL } = globalThis;

if (process.argv.length !== 4) {
  throw new Error("usage: node test/262/single.mjs <stage> <target>");
}

const [_exec, _main, stage, target] = process.argv;

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
      instrument: (code, { kind, specifier }) =>
        recordInstrumentation({
          directory: codebase,
          original: code,
          instrumented: instrument(code, { kind, specifier }),
          kind,
          specifier,
        }),
    },
  }),
);

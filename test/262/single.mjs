/* eslint-disable no-console */

import { runTest } from "./test.mjs";

const { Error, process, URL } = globalThis;

if (!process.execArgv.includes("--experimental-vm-modules")) {
  throw new Error("missing --experimental-vm-modules flag");
}

if (process.argv.length !== 4) {
  throw new Error("usage: node test/262/main.mjs <stage> <target>");
}

const [_exec, _main, stage, target] = process.argv;

const test262 = new URL("../../test262/", import.meta.url);

const {
  default: { instrumenter },
} = /** @type {{default: test262.Stage}} */ (
  await import(`./stages/${stage}.mjs`)
);

console.dir(
  await runTest({
    target,
    test262,
    instrumenter,
  }),
);

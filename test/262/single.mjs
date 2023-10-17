import { inspect } from "node:util";
import { stdout } from "node:process";
import { runTest } from "./test.mjs";

const { Error, process, URL, Infinity } = globalThis;

if (!process.execArgv.includes("--experimental-vm-modules")) {
  throw new Error("missing --experimental-vm-modules flag");
}

if (process.argv.length !== 4) {
  throw new Error("usage: node test/262/main.mjs <stage> <target>");
}

const [_exec, _main, stage, target] = process.argv;

const test262 = new URL("../../test262/", import.meta.url);

const {
  default: { makeInstrumenter },
} = /** @type {{default: test262.Stage}} */ (
  await import(`./stages/${stage}.mjs`)
);

stdout.write(
  inspect(
    await runTest({
      target,
      test262,
      makeInstrumenter,
    }),
    {
      depth: Infinity,
      colors: true,
    },
  ),
  "utf8",
);

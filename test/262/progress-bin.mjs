/* eslint-disable local/strict-console */

import { recordInstrumentation } from "./record.mjs";
import { scrape } from "./scrape.mjs";
import { runTest } from "./test.mjs";

const { parseInt, Error, console, process, URL } = globalThis;

if (!process.execArgv.includes("--experimental-vm-modules")) {
  throw new Error("missing --experimental-vm-modules flag");
}

if (process.argv.length !== 4) {
  throw new Error("usage: node test/262/main.mjs <stage> <position>");
}

const [_exec, _main, stage, position] = process.argv;

const initial = parseInt(position);

const test262 = new URL("../../test262/", import.meta.url);

const {
  default: { tagResult, makeInstrumenter },
} = /** @type {{default: test262.Stage}} */ (
  await import(`./stages/${stage}.mjs`)
);

process.on("uncaughtException", (error, origin) => {
  console.dir({ origin, error });
});

let index = 0;

for await (const url of scrape(new URL("test/", test262))) {
  if (index >= initial) {
    console.dir(index);
    const target = url.href.substring(test262.href.length);
    if (!target.includes("_FIXTURE")) {
      const result = await runTest({
        target,
        test262,
        makeInstrumenter,
      });
      if (result.error !== null && tagResult(result).length === 0) {
        console.dir(result);
        console.dir(
          await runTest({
            target,
            test262,
            makeInstrumenter: (errors) => {
              const { setup, globals, instrument } = makeInstrumenter(errors);
              return {
                setup,
                globals,
                instrument: (code, { kind, specifier }) =>
                  recordInstrumentation({
                    original: code,
                    instrumented: instrument(code, { kind, specifier }),
                    kind,
                    specifier,
                  }),
              };
            },
          }),
        );
        // eslint-disable-next-line local/no-label
        break;
      }
    }
  }
  index += 1;
}

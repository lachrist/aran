/* eslint-disable local/strict-console */

import { stringifyResult } from "./result.mjs";
import { scrape } from "./scrape.mjs";
import { runTest } from "./test.mjs";

const { console, process, URL } = globalThis;

/**
 * @type {(
 *   options: {
 *     test262: URL,
 *     writable: import("node:stream").Writable,
 *     makeInstrumenter: (trace: test262.Log[]) => test262.Instrumenter,
 *   },
 * ) => Promise<boolean>}
 */
export const batch = async ({ test262, writable, makeInstrumenter }) => {
  let index = 0;
  let sigint = 0;
  const interrupt = () => {
    sigint += 1;
    // SIGINT emit twice for some reasons...
    if (sigint > 2) {
      console.log(`force exit at test#${index}`);
      process.exit(1);
    }
  };
  process.addListener("SIGINT", interrupt);
  for await (const url of scrape(new URL("test/", test262))) {
    if (sigint > 0) {
      // eslint-disable-next-line local/no-label
      break;
    }
    if (index % 100 === 0) {
      console.dir(index);
    }
    const target = url.href.substring(test262.href.length);
    if (!target.includes("_FIXTURE")) {
      const result = await runTest({
        target,
        test262,
        makeInstrumenter,
      });
      if (result.error !== null) {
        writable.write(stringifyResult(result));
        writable.write("\n");
      }
    }
    index += 1;
  }
  process.removeListener("SIGINT", interrupt);
  return sigint === 0;
};

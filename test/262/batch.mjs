/* eslint-disable local/strict-console */

import { stringifyResult } from "./result.mjs";
import { scrape } from "./scrape.mjs";
import { runTest } from "./test.mjs";

const { console, process, URL } = globalThis;

/**
 * @type {(
 *   options: {
 *     initial: number,
 *     test262: URL,
 *     isExcluded: (target: string) => boolean,
 *     writable: import("node:stream").Writable,
 *     makeInstrumenter: (errors: test262.Error[]) => test262.Instrumenter,
 *   },
 * ) => Promise<number | null>}
 */
export const batch = async ({
  initial,
  test262,
  isExcluded,
  writable,
  makeInstrumenter,
}) => {
  let index = 0;
  let interrupted = false;
  const interrupt = () => {
    if (interrupted) {
      console.log(`force exit at test#${index}`);
      process.exit(1);
    } else {
      interrupted = true;
    }
  };
  process.addListener("SIGINT", interrupt);
  for await (const url of scrape(new URL("test/", test262))) {
    if (interrupted) {
      // eslint-disable-next-line local/no-label
      break;
    }
    if (index % 100 === 0) {
      console.dir(index);
    }
    if (index >= initial) {
      const target = url.href.substring(test262.href.length);
      if (!target.includes("_FIXTURE") && !isExcluded(target)) {
        const result = await runTest({
          target,
          test262,
          makeInstrumenter,
        });
        if (result.errors.length > 0) {
          writable.write(stringifyResult(result));
          writable.write("\n");
        }
      }
    }
    index += 1;
  }
  process.removeListener("SIGINT", interrupt);
  return index;
};

import { stringifyResult } from "./result.mjs";
import { scrape } from "./scrape.mjs";
import { runTest } from "./test.mjs";

const { process, URL } = globalThis;

/**
 * @type {(
 *   options: {
 *     test262: URL,
 *     isExcluded: (target: string) => boolean,
 *     writable: import("node:stream").Writable,
 *     makeInstrumenter: (errors: test262.Error[]) => test262.Instrumenter,
 *   },
 * ) => Promise<boolean>}
 */
export const batch = async ({
  test262,
  isExcluded,
  writable,
  makeInstrumenter,
}) => {
  let interrupted = false;
  const interrupt = () => {
    interrupted = true;
  };
  process.addListener("SIGINT", interrupt);
  let index = 0;
  for await (const url of scrape(new URL("test/", test262))) {
    if (interrupted) {
      process.removeListener("SIGINT", interrupt);
      return false;
    }
    index += 1;
    if (index % 100 === 0) {
      // eslint-disable-next-line no-console
      console.dir(index);
    }
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
  process.removeListener("SIGINT", interrupt);
  return true;
};

import { stringifyResult } from "./result.mjs";
import { scrape } from "./scrape.mjs";
import { runTest } from "./test.mjs";

const { URL } = globalThis;

/**
 * @type {(
 *   options: {
 *     test262: URL,
 *     isExcluded: (relative: string) => boolean,
 *     writable: import("node:stream").Writable,
 *     instrumenter: test262.Instrumenter,
 *   },
 * ) => Promise<void>}
 */
export const batch = async ({
  test262,
  isExcluded,
  writable,
  instrumenter,
}) => {
  let index = 0;
  for await (const url of scrape(new URL("test/", test262))) {
    index += 1;
    if (index % 100 === 0) {
      // eslint-disable-next-line no-console
      console.dir(index);
    }
    const relative = url.href.substring(test262.href.length);
    if (!relative.includes("_FIXTURE") && !isExcluded(relative)) {
      const result = await runTest({
        relative,
        test262,
        instrumenter,
      });
      if (result.errors.length > 0) {
        writable.write(stringifyResult(result));
        writable.write("\n");
      }
    }
  }
};

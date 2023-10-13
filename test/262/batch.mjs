import { scrape } from "./scrape.mjs";
import { runTest } from "./test.mjs";

const { process, JSON, URL } = globalThis;

process.on("uncaughtException", (error, origin) => {
  // eslint-disable-next-line no-console
  console.dir({ origin, error });
});

/**
 * @type {(
 *   options: {
 *     test262: URL,
 *     isExcluded: (relative: string) => boolean,
 *     writable: import("node:stream").Writable,
 *     instrument: (code: string, kind: "script" | "module") => string,
 *   },
 * ) => Promise<void>}
 */
export const batch = async ({ test262, isExcluded, writable, instrument }) => {
  let index = 0;
  for await (const url of scrape(new URL("test/", test262))) {
    index += 1;
    if (index % 100 === 0) {
      // eslint-disable-next-line no-console
      console.dir(index);
    }
    const relative = url.href.substring(test262.href.length);
    if (!relative.includes("_FIXTURE") && !isExcluded(relative)) {
      const errors = await runTest({ relative, test262, instrument });
      if (errors.length > 0) {
        writable.write(JSON.stringify([relative, errors]));
        writable.write("\n");
      }
    }
  }
};

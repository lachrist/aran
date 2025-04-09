import { scrape } from "./scrape.mjs";
import { TEST262 } from "../layout.mjs";
import { stdout } from "node:process";
import { compileFetchTarget, toTestPath } from "../fetch.mjs";
import { parseTestFile } from "../test-file/index.mjs";
import { saveTestCase } from "./catalog.mjs";

const { URL } = globalThis;

/**
 * @type {() => AsyncGenerator<import("../test-case.d.ts").TestCase>}
 */
const loadTestCase = async function* () {
  const fetchTarget = compileFetchTarget(TEST262);
  let index = 0;
  for await (const url of scrape(new URL("test/", TEST262))) {
    if (index % 100 === 0) {
      stdout.write(`${index}\n`);
    }
    const path = toTestPath(url, TEST262);
    if (path !== null) {
      yield* parseTestFile({
        path,
        content: await fetchTarget(path),
      });
    }
    index++;
  }
};

await saveTestCase(loadTestCase());

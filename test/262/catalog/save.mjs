import { open } from "node:fs/promises";
import { scrape } from "./scrape.mjs";
import { TEST262 } from "../layout.mjs";
import { stdout } from "node:process";
import { compileFetchTarget, toTestPath } from "../fetch.mjs";
import { parseTestFile, packTestCase } from "../test-file/index.mjs";
import { CATALOG } from "./layout.mjs";

const { URL, JSON } = globalThis;

const main = async () => {
  const handle = await open(CATALOG, "w");
  try {
    const stream = handle.createWriteStream({ encoding: "utf-8" });
    const fetchTarget = compileFetchTarget(TEST262);
    let index = 0;
    for await (const url of scrape(new URL("test/", TEST262))) {
      index++;
      if (index % 100 === 0) {
        stdout.write(`${index}\n`);
      }
      const path = toTestPath(url, TEST262);
      if (path !== null) {
        for (const test_case of parseTestFile({
          path,
          content: await fetchTarget(path),
        })) {
          stream.write(JSON.stringify(packTestCase(test_case)) + "\n");
        }
      }
    }
  } finally {
    await handle.close();
  }
};

await main();

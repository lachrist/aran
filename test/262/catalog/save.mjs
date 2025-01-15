import { open } from "node:fs/promises";
import { scrape } from "./scrape.mjs";
import { home } from "../layout.mjs";
import { stdout } from "node:process";
import { compileFetchTarget, toTestPath } from "../fetch.mjs";
import { parseTestFile, packTestCase } from "../test-file/index.mjs";
import { CATALOG } from "./layout.mjs";

const { URL, JSON } = globalThis;

const handle = await open(CATALOG, "w");

const fetchTarget = compileFetchTarget(home);

let index = 0;

for await (const url of scrape(new URL("test/", home))) {
  index++;
  if (index % 100 === 0) {
    stdout.write(`${index}\n`);
  }
  const path = toTestPath(url, home);
  if (path !== null) {
    for (const test_case of parseTestFile({
      path,
      content: await fetchTarget(path),
    })) {
      handle.write(JSON.stringify(packTestCase(test_case)) + "\n");
    }
  }
}

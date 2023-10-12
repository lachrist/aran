import { scrape } from "./scrape.mjs";
import { runTest } from "./test.mjs";
import { createWriteStream } from "node:fs";
import { cwd as getCwd, argv } from "node:process";
import { pathToFileURL } from "node:url";

const cwd = pathToFileURL(`${getCwd()}/`);

const root = new URL(argv[2].endsWith("/") ? argv[2] : `${argv[2]}/`, cwd);

/** @type {(feature: string) => boolean} */
const isExcluded = (feature) =>
  feature === "IsHTMLDDA" ||
  feature === "Temporal" ||
  feature === "Atomics" ||
  feature === "tail-call-optimization" ||
  feature === "Array.fromAsync" ||
  feature === "iterator-helpers" ||
  feature === "array-grouping";

// const start = 0;

let index = 0;

const writable = createWriteStream(new URL("failures.txt", import.meta.url));

/** @type {(error: import("./types").TestError) => boolean} */
const isExpected = ({ type }) => type === "exclusion" || type === "realm";

for await (const url of scrape(new URL("test/", root))) {
  index += 1;
  if (!url.href.includes("_FIXTURE")) {
    const errors = await runTest(url, root, isExcluded);
    if (errors.length > 0) {
      if (!errors.some(isExpected)) {
        const relative = url.href.substring(cwd.href.length);
        // eslint-disable-next-line no-console
        console.log(index, relative);
        // eslint-disable-next-line no-console
        console.dir(errors);
        writable.write(`${relative}\n`);
      }
    }
  }
}

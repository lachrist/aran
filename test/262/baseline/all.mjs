import { scrape } from "../scrape.mjs";
import { runTest } from "../test.mjs";
import { createWriteStream } from "node:fs";
import { pathToFileURL } from "node:url";

const { process, JSON, URL } = globalThis;

const cwd = pathToFileURL(`${process.cwd()}/`);

const root = new URL(
  process.argv[2].endsWith("/") ? process.argv[2] : `${process.argv[2]}/`,
  cwd,
);

process.on("uncaughtException", (error, origin) => {
  // eslint-disable-next-line no-console
  console.dir({ origin, error });
});

let index = 0;

const writable = createWriteStream(new URL("failures.txt", import.meta.url));

for await (const url of scrape(new URL("test/", root))) {
  index += 1;
  if (index % 100 === 0) {
    // eslint-disable-next-line no-console
    console.dir(index);
  }
  if (!url.href.includes("_FIXTURE")) {
    const errors = await runTest(url, root);
    if (errors.length > 0) {
      const relative = url.href.substring(cwd.href.length);
      writable.write(JSON.stringify([relative, errors]));
      writable.write("\n");
    }
  }
}

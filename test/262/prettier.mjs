import { argv } from "node:process";
import { readFile, writeFile } from "node:fs/promises";
import { format } from "prettier";

const { URL } = globalThis;

const url = new URL(argv[2]);

await writeFile(
  url,
  await format(await readFile(url, "utf8"), {
    parser: "acorn",
  }),
  "utf8",
);

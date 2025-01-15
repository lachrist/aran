import { readdir, writeFile } from "node:fs/promises";

const { URL, JSON } = globalThis;

const tags = (await readdir(new URL("data", import.meta.url))).map(
  (name) => `\n  | ${JSON.stringify(name.split(".")[0])}`,
);

await writeFile(
  new URL("tag.d.ts", import.meta.url),
  `export type Tag = ${tags.join("")};\n`,
);

import { readdir, writeFile } from "node:fs/promises";

const { URL, JSON } = globalThis;

const names = (await readdir(new URL("data", import.meta.url))).map(
  (name) => name.split(".")[0],
);

await writeFile(
  new URL("tag.d.ts", import.meta.url),
  `export type Tag = ${names.map((name) => `\n  | ${JSON.stringify(name)}`).join("")};\n`,
  "utf-8",
);

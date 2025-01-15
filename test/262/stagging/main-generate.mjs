import { readdir, writeFile } from "node:fs/promises";

const { URL, JSON } = globalThis;

const names = (await readdir(new URL("spec", import.meta.url))).map(
  (name) => name.split(".")[0],
);

await writeFile(
  new URL("stage-name.d.ts", import.meta.url),
  `export type StageName = ${names.map((name) => `\n  | ${JSON.stringify(name)}`).join("")};\n`,
);

await writeFile(
  new URL("stage-name.mjs", import.meta.url),
  [
    '/** @type {{[key in import("./stage-name").StageName]: null}} */',
    "export const STAGE_ENUM = {",
    ...names.map((name) => `  ${JSON.stringify(name)}: null,`),
    "};",
    "",
  ].join("\n"),
  "utf-8",
);

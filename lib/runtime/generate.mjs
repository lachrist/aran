/* eslint-disable */

import { format } from "prettier";
import { generateIntrinsicRecordModule } from "../setup/index.mjs";
import { generate } from "astring";
import { writeFile } from "node:fs/promises";

const { URL } = globalThis;

await writeFile(
  new URL("./index.mjs", import.meta.url),
  await format(
    [
      "// @ts-nocheck",
      "/* eslint-disable */",
      "/** @type {(global: typeof globalThis) => import('../lang/syntax').IntrinsicRecord} */",
      generate(generateIntrinsicRecordModule()),
    ].join("\n"),
    { parser: "acorn" },
  ),
  "utf8",
);

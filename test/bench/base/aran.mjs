import { log } from "node:console";
import { readFile } from "node:fs/promises";
import { parse } from "acorn";
import { generate } from "astring";
import { transpile, retropile } from "aran";

const { URL } = globalThis;

const root = parse(
  await readFile(new URL("../base/input.mjs", import.meta.url), "utf8"),
  { sourceType: "module", ecmaVersion: 2024 },
);

log(
  generate(retropile(transpile({ kind: "module", path: "$.mjs", root }))).slice(
    0,
    100,
  ),
);

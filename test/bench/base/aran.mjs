import { parse } from "acorn";
import { transpile, retropile } from "aran";
import { generate } from "astring";
import { log } from "node:console";

const root = parse("123;", {
  locations: true,
  sourceType: "module",
  ecmaVersion: 2024,
});

log(generate(retropile(transpile({ kind: "module", path: "$.mjs", root }))));

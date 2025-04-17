import { parse } from "acorn";
import { generate } from "astring";
import { transpile, retropile } from "aran";
import {
  provenance_advice_global_variable,
  intrinsic_global_variable,
} from "./bridge.mjs";
import { weave } from "linvail";
import { readFile, writeFile } from "node:fs/promises";

const { URL } = globalThis;

{
  const path1 = new URL("./analysis.mjs", import.meta.url);
  const path2 = new URL("./analysis.inst.mjs", import.meta.url);
  const content1 = await readFile(path1, "utf8");
  const content2 = generate(
    retropile(
      weave(
        transpile({
          path: path1,
          kind: "module",
          root: parse(content1, {
            locations: false,
            sourceType: "module",
            ecmaVersion: 2024,
          }),
        }),
        { advice_global_variable: provenance_advice_global_variable },
      ),
      { intrinsic_global_variable },
    ),
  );
  await writeFile(
    path2,
    ["// @ts-nocheck", "/* eslint-disable */", content2].join("\n"),
    "utf8",
  );
}

import { instrument } from "../lib/index.mjs";
import { parse } from "acorn";
import { generate } from "astring";

const { eval: evalGlobal } = globalThis;

evalGlobal(
  generate(
    instrument(
      {
        kind: "eval",
        situ: "global",
        context: {},
        base: "playground",
        root: /** @type {any} */ (
          parse("123;", {
            sourceType: "script",
            ecmaVersion: "latest",
          })
        ),
      },
      {
        mode: "standalone",
      },
    ),
  ),
);

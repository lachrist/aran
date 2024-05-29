import { instrument, ROOT_PATH } from "../lib/index.mjs";
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
        path: ROOT_PATH,
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

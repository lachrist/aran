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
          parse("(function (...args) { console.log(args); })`foo${123}bar`;", {
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

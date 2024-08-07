import { instrument, ROOT_PATH } from "../lib/index.mjs";
import { parse } from "acorn";
import { generate } from "astring";

// const { eval: evalGlobal } = globalThis;

const code = `
  for (const x of [123]) {
    throw x;
  }
`;

console.log(
  generate(
    instrument(
      {
        kind: "eval",
        situ: "global",
        context: {},
        path: ROOT_PATH,
        root: /** @type {any} */ (
          parse(code, {
            sourceType: "script",
            ecmaVersion: "latest",
          })
        ),
      },
      {
        mode: "normal",
      },
    ),
  ),
);

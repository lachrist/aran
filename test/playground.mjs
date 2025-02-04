// @ts-nocheck

import { setupile, transpile, retropile } from "aran";
import { parse } from "acorn";
import { generate } from "astring";
import {
  advice_global_variable,
  weave,
  createAdvice,
} from "./aspects/tree-size.mjs";

const { eval: evalGlobal } = globalThis;

const intrinsics = evalGlobal(generate(setupile({})));

/** @type {any} */ (globalThis)[advice_global_variable] = createAdvice(
  /** @type {any} */ (intrinsics["aran.global_object"]).Reflect,
  (kind, size, tag) => {
    // eslint-disable-next-line no-console
    console.dir({ kind, size, tag });
  },
);

const code = `{
  for (let x = 0; x < 10; x++) {
    console.log(x);
  }
}`;

evalGlobal(
  generate(
    retropile(
      weave(
        transpile(
          {
            kind: "eval",
            path: "main",
            root: parse(code, {
              sourceType: "script",
              ecmaVersion: "latest",
            }),
          },
          {
            digest: (_node, node_path, _file_path, _node_kind) => node_path,
            global_declarative_record: "builtin",
          },
        ),
      ),
      {
        mode: "normal",
      },
    ),
  ),
);

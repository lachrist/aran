/* eslint-disable local/no-deep-import */

import { generateSetup, transpile, retropile } from "aran";
import { parse } from "acorn";
import { generate } from "astring";
import {
  ADVICE_GLOBAL_VARIABLE,
  createTraceAdvice,
  weave,
} from "./aspects/trace.mjs";

const { eval: evalGlobal } = globalThis;

const code = `
  const fac = (n) => n === 0 ? 1 : n * fac(n - 1);
  fac(3);
`;

const intrinsics = evalGlobal(generate(generateSetup({})));

/** @type {any} */ (globalThis)[ADVICE_GLOBAL_VARIABLE] = createTraceAdvice(
  intrinsics["aran.global"].Reflect,
);

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
            digest: (_node, node_path, file_path, _node_kind) =>
              `${file_path}:${node_path}`,
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

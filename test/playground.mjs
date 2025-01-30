import { setupile, transpile, retropile, weaveStandard } from "aran";
import { parse } from "acorn";
import { generate } from "astring";
import {
  weave_config,
  advice_global_variable,
  createTraceAdvice,
} from "./aspects/trace.mjs";

const { eval: evalGlobal } = globalThis;

const code = `
  function* g () { yield 123; yield 456; }
  Array.from(g());
`;

const intrinsics = evalGlobal(generate(setupile({})));

/** @type {any} */ (globalThis)[advice_global_variable] = createTraceAdvice(
  weaveStandard,
  /** @type {any} */ (intrinsics["aran.global_object"]),
);

evalGlobal(
  generate(
    retropile(
      weaveStandard(
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
        weave_config,
      ),
      {
        mode: "normal",
      },
    ),
  ),
);

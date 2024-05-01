import { setup, instrument } from "../../lib/index.mjs";
import { parse } from "acorn";
import { generate } from "astring";

const { eval: evalGlobal } = globalThis;

/**
 * @type {import("../../type/advice").Advice<string>}
 */
globalThis.advice = {};

evalGlobal(generate(setup()));

/**
 * @type {(code: string, kind: "module" | "script") => string}
 */
export default (code, kind) =>
  generate(
    instrument(
      {
        kind,
        root: /** @type {any} */ (
          parse(code, { ecmaVersion: 2023, sourceType: kind })
        ),
        base: "main",
        context: {
          type: "global",
        },
      },
      { pointcut: false, global_declarative_record: "native" },
    ),
  );

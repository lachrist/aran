import { setup, instrument } from "../../lib/index.mjs";
import { parse } from "acorn";
import { generate } from "astring";

const { eval: evalGlobal } = globalThis;

/**
 * @type {import("../../type/advice").Advice<unknown, string>}
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
        root: /** @type {estree.Program} */ (
          /** @type {unknown} */ (
            parse(code, { ecmaVersion: 2023, sourceType: kind })
          )
        ),
        base: "main",
      },
      {
        source: kind,
        mode: "sloppy",
        scope: "alien",
      },
      { pointcut: false },
    ),
  );

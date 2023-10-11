import { setup, instrument } from "../../lib/index.mjs";
import { parse } from "acorn";
import { generate } from "astring";

const { eval: evalGlobal } = globalThis;

/**
 * @type {import("../../lib/index.mjs").Advice<unknown, string>}
 */
globalThis.advice = {};

console.log(generate(setup()));

evalGlobal(generate(setup()));

/**
 * @type {(code: string, kind: "module" | "script") => string}
 */
export default (code, kind) =>
  generate(
    instrument(
      /** @type {estree.Program} */ (
        /** @type {unknown} */ (
          parse(code, { ecmaVersion: 2023, sourceType: kind })
        )
      ),
      { pointcut: false },
    ),
  );

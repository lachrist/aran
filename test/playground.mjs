/* eslint-disable no-console */

import { instrument, generateSetup } from "../lib/index.mjs";
import { parse } from "acorn";
import { generate } from "astring";
// eslint-disable-next-line local/no-deep-import
import { INITIAL_INDENT, makeTraceAdvice } from "./aspects/trace.mjs";

const { Error, eval: evalGlobal } = globalThis;

const ADVICE = "__ARAN_ADVICE__";

const code = `
  const fac = (n) => n === 0 ? 1 : n * fac(n - 1);
  fac(3);
`;

const intrinsics = evalGlobal(generate(generateSetup({})));

/** @type {any} */ (globalThis)[ADVICE] = makeTraceAdvice({
  intrinsics,
  report: (_name, message) => new Error(message),
  instrumentLocalEvalCode: (code, situ) =>
    generate(
      instrument(
        {
          kind: "eval",
          situ,
          path: "dynamic",
          root: parse(code, {
            sourceType: "script",
            ecmaVersion: "latest",
          }),
        },
        {
          advice_variable: ADVICE,
          standard_pointcut: true,
          initial_state: INITIAL_INDENT,
        },
      ),
    ),
});

evalGlobal(
  generate(
    instrument(
      {
        kind: "eval",
        situ: { type: "global" },
        path: "main",
        root: parse(code, {
          sourceType: "script",
          ecmaVersion: "latest",
        }),
      },
      {
        advice_variable: ADVICE,
        standard_pointcut: true,
        initial_state: INITIAL_INDENT,
      },
    ),
  ),
);

import { parse } from "acorn";
import { generate } from "astring";
import { transpile, retropile, weaveStandard } from "aran";
import {
  analysis_advice_global_variable,
  provenance_advice_global_variable,
  intrinsic_global_variable,
  analysis_pointcut,
} from "./bridge.mjs";
import { weave } from "linvail";

/**
 * @type {import("../../instrument.d.ts").Instrument}
 */
export default ({ kind, code }) =>
  generate(
    retropile(
      weave(
        weaveStandard(
          transpile({
            path: "$",
            kind,
            root: parse(code, {
              locations: false,
              sourceType: kind,
              ecmaVersion: 2024,
            }),
          }),
          {
            advice_global_variable: analysis_advice_global_variable,
            pointcut: analysis_pointcut,
          },
        ),
        { advice_global_variable: provenance_advice_global_variable },
      ),
      { intrinsic_global_variable },
    ),
  );

import { parse } from "acorn";
import { generate } from "astring";
import { transpile, retropile, weaveStandard } from "aran";
import {
  advice_global_variable,
  intrinsic_global_variable,
} from "../bridge.mjs";
import { standard_pointcut as pointcut } from "linvail";

/**
 * @type {(
 *   global_declarative_record: "builtin" | "emulate",
 * ) => import("../../../instrument.js").Instrument}
 */
export const compileInstrument =
  (global_declarative_record) =>
  ({ kind, code }) =>
    generate(
      retropile(
        weaveStandard(
          transpile(
            {
              path: "$",
              kind,
              root: parse(code, {
                locations: false,
                sourceType: kind,
                ecmaVersion: 2024,
              }),
            },
            { global_declarative_record },
          ),
          { advice_global_variable, pointcut },
        ),
        { intrinsic_global_variable },
      ),
    );

import { parse } from "acorn";
import { generate } from "astring";
import { transpile, retropile } from "aran";
import {
  advice_global_variable,
  intrinsic_global_variable,
} from "../bridge.mjs";
import { weave } from "linvail";

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
        weave(
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
          { advice_global_variable },
        ),
        { intrinsic_global_variable },
      ),
    );

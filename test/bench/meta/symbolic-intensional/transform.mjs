import { parse } from "acorn";
import { generate } from "astring";
import { transpile, retropile, weaveStandard } from "aran";
import {
  advice_global_variable,
  intrinsic_global_variable,
} from "./bridge.mjs";
import { standard_pointcut as pointcut } from "linvail";

/** @type {import("../../transform.js").Transform} */
export default {
  transformMeta: ({ code }) => code,
  transformBase: ({ path, kind, code }) =>
    generate(
      retropile(
        weaveStandard(
          transpile({
            path,
            kind,
            root: parse(code, {
              locations: false,
              sourceType: kind,
              ecmaVersion: 2024,
            }),
          }),
          { advice_global_variable, pointcut },
        ),
        { intrinsic_global_variable },
      ),
    ),
};

import { parse } from "acorn";
import { generate } from "astring";
import { transpile, retropile } from "aran";
import { weave } from "linvail/instrument";
import {
  advice_global_variable,
  intrinsic_global_variable,
} from "./bridge.mjs";

/** @type {import("../../transform.d.ts").Transform} */
export default {
  transformMeta: ({ code }) => code,
  transformBase: ({ path, kind, code }) =>
    generate(
      retropile(
        weave(
          transpile({
            path,
            kind,
            root: parse(code, {
              locations: false,
              sourceType: kind,
              ecmaVersion: 2024,
            }),
          }),
          { advice_global_variable },
        ),
        { intrinsic_global_variable },
      ),
    ),
};

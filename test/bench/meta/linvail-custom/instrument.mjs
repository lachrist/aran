import { parse } from "acorn";
import { generate } from "astring";
import { transpile, retropile } from "aran";
import {
  advice_global_variable,
  intrinsic_global_variable,
} from "./bridge.mjs";
import { weave } from "linvail";

/** @type {import("../../instrument.d.ts").Instrument} */
export default ({ path, kind, code }) =>
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
  );

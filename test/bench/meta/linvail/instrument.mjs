import { parse } from "acorn";
import { generate } from "astring";
import { transpile, retropile, weaveStandard } from "aran";
import {
  advice_global_variable,
  intrinsic_global_variable,
} from "./bridge.mjs";
import { weave as weaveCustom, standard_pointcut as pointcut } from "linvail";

const { Error } = globalThis;

/**
 * @type {(
 *   root: import("aran").Program<any>,
 *   config: {
 *     advice_format: "standard" | "custom",
 *   },
 * ) => import("aran").Program}
 */
const weave = (root, { advice_format }) => {
  switch (advice_format) {
    case "custom": {
      return weaveCustom(root, { advice_global_variable });
    }
    case "standard": {
      return weaveStandard(root, { advice_global_variable, pointcut });
    }
    default: {
      throw new Error("invalid advice_format");
    }
  }
};

/**
 * @type {(
 *   config: {
 *     global_declarative_record: "builtin" | "emulate",
 *     advice_format: "standard" | "custom",
 *   },
 * ) => import("../../instrument.js").Instrument}
 */
export const compileInstrument =
  ({ global_declarative_record, advice_format }) =>
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
          { advice_format },
        ),
        { intrinsic_global_variable },
      ),
    );

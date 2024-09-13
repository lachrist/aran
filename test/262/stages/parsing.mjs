import { parse } from "acorn";
import { generate } from "astring";
import { serializeError } from "../error-serial.mjs";

/** @type {import("../stage").Stage} */
export default {
  precursor: ["identity"],
  negative: ["literal-module-specifier"],
  exclude: [],
  listLateNegative: (_target, _metadata, _error) => [],
  setup: (_context) => {},
  instrument: (source) => {
    try {
      return {
        type: "success",
        data: {
          location: source.path,
          content: generate(
            parse(source.content, {
              ecmaVersion: 2024,
              sourceType: source.kind === "eval" ? "script" : source.kind,
            }),
          ),
        },
      };
    } catch (error) {
      return {
        type: "failure",
        data: serializeError(error),
      };
    }
  },
};

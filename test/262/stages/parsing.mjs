import { parse } from "acorn";
import { generate } from "astring";

/** @type {import("../stage").Stage} */
export default {
  precursor: ["identity"],
  negative: ["literal-module-specifier"],
  exclude: [],
  listLateNegative: (_target, _metadata, _error) => [],
  setup: (_context) => {},
  instrument: ({ path, content, kind }) => ({
    path,
    content: generate(
      parse(content, {
        ecmaVersion: 2024,
        sourceType: kind,
      }),
    ),
  }),
};

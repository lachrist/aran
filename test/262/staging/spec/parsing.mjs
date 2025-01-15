import { generate, parseGlobal } from "../estree.mjs";

/** @type {import("../stage").Stage} */
export default {
  precursor: ["identity"],
  negative: ["parsing-function-string-representation"],
  exclude: [],
  listLateNegative: (_test_case, _error) => [],
  setup: (_context) => {},
  instrument: ({ path, content, kind }) => ({
    path,
    content: generate(parseGlobal(kind, content)),
  }),
};

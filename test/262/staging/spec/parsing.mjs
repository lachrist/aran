import { generate, parseGlobal } from "../estree.mjs";

/** @type {import("../stage").Stage} */
export default {
  precursor: ["identity"],
  negative: [
    "parsing-function-string-representation",
    "parsing-cover-parenthesis",
    "parsing-import-assertion",
    "parsing-unknown",
  ],
  exclude: [],
  listLateNegative: (_test, _error) => [],
  setup: (_context) => {},
  instrument: ({ path, content, kind }) => ({
    path,
    content: generate(parseGlobal(kind, content)),
  }),
};

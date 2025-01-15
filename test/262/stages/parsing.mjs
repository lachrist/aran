import { generate, parseGlobal } from "../aran.mjs";

/** @type {import("../stage").Stage} */
export default {
  precursor: ["identity"],
  negative: ["parsing-function-string-representation"],
  exclude: [],
  listLateNegative: (_specifier, _metadata, _error) => ["parsing"],
  setup: (_context) => {},
  instrument: ({ path, content, kind }) => ({
    path,
    content: generate(parseGlobal(kind, content)),
  }),
};

import { generate, parseGlobal } from "../aran.mjs";

/** @type {import("../stage").Stage} */
export default {
  precursor: ["identity"],
  negative: ["literal-module-specifier"],
  exclude: [],
  listLateNegative: (_specifier, _metadata, _error) => [],
  setup: (_context) => {},
  instrument: ({ path, content, kind }) => ({
    path,
    content: generate(parseGlobal(kind, content)),
  }),
};

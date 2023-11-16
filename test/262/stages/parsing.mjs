import { parse } from "acorn";
import { generate } from "astring";

/** @type {test262.Stage} */
export default {
  requirement: ["identity"],
  tagFailure: (_failure) => ["acorn"],
  createInstrumenter: (_options) => ({
    setup: "",
    globals: {},
    instrument: ({ kind, url, content }) => ({
      kind,
      url,
      content: generate(
        parse(content, { ecmaVersion: "latest", sourceType: kind }),
      ),
    }),
  }),
};

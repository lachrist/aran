import { parse } from "acorn";
import { generate } from "astring";

/** @type {test262.Stage} */
export default {
  requirement: ["identity"],
  tagFailure: (_failure) => ["acorn"],
  instrumenter: {
    setup: "",
    globals: [],
    instrument: (code, { kind }) =>
      generate(parse(code, { ecmaVersion: "latest", sourceType: kind })),
  },
};

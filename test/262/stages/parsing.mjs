import { parse } from "acorn";
import { generate } from "astring";

/** @type {test262.Stage} */
export default {
  requirements: ["identity"],
  filtering: [],
  makeInstrumenter: (_errors) => ({
    setup: "",
    globals: [],
    instrument: (code, { kind }) =>
      generate(parse(code, { ecmaVersion: "latest", sourceType: kind })),
  }),
};

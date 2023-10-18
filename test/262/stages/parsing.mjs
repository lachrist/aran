import { parse } from "acorn";
import { generate } from "astring";
import { listStageFailure } from "../dump.mjs";

/** @type {test262.Stage} */
export default {
  exclusion: await listStageFailure("identity"),
  filtering: [],
  makeInstrumenter: (_errors) => ({
    setup: "",
    globals: [],
    instrument: (code, { kind }) =>
      generate(parse(code, { ecmaVersion: "latest", sourceType: kind })),
  }),
};

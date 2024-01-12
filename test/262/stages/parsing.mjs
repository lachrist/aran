import { parse } from "acorn";
import { generate } from "astring";

/** @type {test262.Stage} */
export default {
  requirement: ["identity"],
  exclusion: [],
  expect: ({ error }) => (error === null ? [] : ["acorn"]),
  createInstrumenter: ({ record }) => ({
    setup: [],
    globals: {},
    instrument: ({ kind, url, content }) =>
      record({
        kind,
        url,
        content: generate(
          parse(content, { ecmaVersion: "latest", sourceType: kind }),
        ),
      }),
  }),
};

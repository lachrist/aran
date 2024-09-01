import { parse } from "acorn";
import { generate } from "astring";

/** @type {import("../stage").Stage} */
export default {
  precursor: ["identity"],
  negative: [],
  exclude: [],
  listLateNegative: (_target, _metadata, _error) => [],
  compileInstrument:
    ({ record }) =>
    ({ kind, url, content }) =>
      record({
        kind,
        url,
        content: generate(
          parse(content, { ecmaVersion: "latest", sourceType: kind }),
        ),
      }),
};

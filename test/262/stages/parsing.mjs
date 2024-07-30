import { parse } from "acorn";
import { generate } from "astring";

const { Promise } = globalThis;

/** @type {import("../stage").Stage} */
export default (_argv) =>
  Promise.resolve({
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
  });

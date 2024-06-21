import { parse } from "acorn";
import { generate } from "astring";
import { readFile } from "node:fs/promises";
import { parseFailure } from "../failure.mjs";

const { Set } = globalThis;

/**
 * @type {Set<string>}
 */
const exclusion = new Set(
  parseFailure(await readFile("./identity.failure.json", "utf8")).map(
    ([target]) => target,
  ),
);

/** @type {import("../types").Stage} */
export default {
  isExcluded: (target) => exclusion.has(target),
  predictStatus: (_target) => "flaky",
  listCause: (_result) => [],
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

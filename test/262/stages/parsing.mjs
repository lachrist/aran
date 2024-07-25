import { parse } from "acorn";
import { generate } from "astring";
import { readFile } from "node:fs/promises";
import { getFailureTarget, parseFailureArray } from "../failure.mjs";

const { Set, URL } = globalThis;

const exclusion = new Set(
  parseFailureArray(
    await readFile(new URL("./identity.failure.txt", import.meta.url), "utf8"),
  ).map(getFailureTarget),
);

/** @type {import("../types").Stage} */
export default (_argv) => ({
  isExcluded: (target) => exclusion.has(target),
  predictStatus: (_target) => "flaky",
  listCause: (_result) => ["acorn-astring"],
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

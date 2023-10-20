import { parse } from "acorn";
import { generate } from "astring";
import { listDumpFailure } from "../result.mjs";
import { readFile } from "node:fs/promises";

const { URL, Set } = globalThis;

const exclusion = new Set(
  listDumpFailure(
    await readFile(new URL("identity.jsonlist", import.meta.url), "utf8"),
  ),
);

/** @type {test262.Stage} */
export default {
  tagResult: ({ target }) => (exclusion.has(target) ? ["excluded"] : []),
  makeInstrumenter: (_errors) => ({
    setup: "",
    globals: [],
    instrument: (code, { kind }) =>
      generate(parse(code, { ecmaVersion: "latest", sourceType: kind })),
  }),
};

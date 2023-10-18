import { parse } from "acorn";
import { generate } from "astring";
import { listDumpFailure } from "../result.mjs";
import { readFile } from "node:fs/promises";

const { URL } = globalThis;

/** @type {test262.Stage} */
export default {
  exclusion: listDumpFailure(
    await readFile(new URL("identity.jsonlist", import.meta.url), "utf8"),
  ),
  filtering: [],
  makeInstrumenter: (_errors) => ({
    setup: "",
    globals: [],
    instrument: (code, { kind }) =>
      generate(parse(code, { ecmaVersion: "latest", sourceType: kind })),
  }),
};

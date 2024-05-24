import { readFile } from "node:fs/promises";
import { compileExpect, compileCompileAranInstrument } from "./util/index.mjs";

const { JSON, URL } = globalThis;

/** @type {test262.Stage} */
export default {
  requirement: ["identity", "parsing"],
  exclusion: [],
  expect: compileExpect(
    JSON.parse(
      await readFile(
        new URL("empty-native.manual.json", import.meta.url),
        "utf8",
      ),
    ),
  ),
  compileInstrument: compileCompileAranInstrument(
    ({ intrinsic, instrument }) => ({
      "__proto__": null,
      "eval.before": (code, context, location) => {
        if (typeof code === "string") {
          return instrument(code, context, location);
        } else {
          return intrinsic.undefined;
        }
      },
    }),
    { global_declarative_record: "native" },
  ),
};

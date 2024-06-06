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
      type: "standard",
      data: {
        "eval@before": (_state, code, context, path) => {
          if (typeof code === "string") {
            return instrument(code, context, path);
          } else {
            return intrinsic.undefined;
          }
        },
      },
    }),
    { global_declarative_record: "native" },
  ),
};

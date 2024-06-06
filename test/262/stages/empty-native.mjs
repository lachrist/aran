/* eslint-disable no-use-before-define */

import { readFile } from "node:fs/promises";
import {
  compileExpect,
  compileStandardInstrumentation,
} from "./util/index.mjs";

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
  compileInstrument: ({ record, warning, context }) => {
    /**
     * @type {import("../../../lib").StandardAspect<
     *   null,
     *   import("../../../lib").StandardValue,
     * >}
     */
    const aspect = {
      "eval@before": (_state, context, code, path) => {
        if (typeof code === "string") {
          return instrumentDeep(code, context, path);
        } else {
          return intrinsic.undefined;
        }
      },
    };
    const { intrinsic, instrumentDeep, instrumentRoot } =
      compileStandardInstrumentation(aspect, {
        record,
        warning,
        context,
        global_declarative_record: "native",
      });
    return instrumentRoot;
  },
};

/* eslint-disable no-use-before-define */

import { readFile } from "node:fs/promises";
import { compileStandardInstrumentation } from "./util/index.mjs";
import { matchNegativeRecord, parseNegativeRecord } from "../negative.mjs";

const { URL } = globalThis;

const negative = parseNegativeRecord(
  await readFile(new URL("aran.outcome.json", import.meta.url), "utf8"),
);

/** @type {test262.Stage} */
export default {
  requirement: ["identity", "parsing"],
  exclusion: [],
  expect: (target) => matchNegativeRecord(negative, target),
  compileInstrument: ({ record, warning, context }) => {
    /**
     * @type {import("../../../lib").StandardAspect<
     *   null,
     *   import("../../../lib").Valuation,
     * >}
     */
    const aspect = {
      "eval@before": (_state, context, value, path) => {
        if (typeof value === "string") {
          return instrumentDeep(value, context, path);
        } else {
          return value;
        }
      },
    };
    const { instrumentDeep, instrumentRoot } = compileStandardInstrumentation(
      aspect,
      {
        record,
        warning,
        context,
        global_declarative_record: "native",
      },
    );
    return instrumentRoot;
  },
};

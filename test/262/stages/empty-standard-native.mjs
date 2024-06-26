/* eslint-disable no-use-before-define */

import { readFile } from "node:fs/promises";
import { compileStandardInstrumentation } from "./util/index.mjs";
import {
  getNegativeStatus,
  listNegativeCause,
  parseNegative,
} from "../negative.mjs";
import { getFailureTarget, parseFailureArray } from "../failure.mjs";

const { Set, URL } = globalThis;

const exclusion = new Set(
  parseFailureArray(
    [
      await readFile(new URL("identity.failure.txt", import.meta.url), "utf8"),
      await readFile(new URL("parsing.failure.txt", import.meta.url), "utf8"),
    ].join("\n"),
  ).map(getFailureTarget),
);

const negative = parseNegative(
  await readFile(new URL("empty.negative.txt", import.meta.url), "utf8"),
);

/** @type {import("../types").Stage} */
export default {
  isExcluded: (target) => exclusion.has(target),
  predictStatus: (target) => getNegativeStatus(negative, target),
  listCause: (result) => listNegativeCause(negative, result.target),
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

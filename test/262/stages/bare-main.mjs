/* eslint-disable no-use-before-define */

import { readFile } from "node:fs/promises";
import {
  getNegativeStatus,
  listNegativeCause,
  parseNegative,
} from "../negative.mjs";
import { getFailureTarget, parseFailureArray } from "../failure.mjs";
import { setupBasicMembrane } from "./util/index.mjs";

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
  await readFile(new URL("bare.negative.txt", import.meta.url), "utf8"),
);

/**
 * @type {import("../types").Stage}
 */
export default {
  isExcluded: (target) => exclusion.has(target),
  predictStatus: (target) => getNegativeStatus(negative, target),
  listCause: (result) => listNegativeCause(negative, result.target),
  compileInstrument: ({ record, warning, context }) => {
    /**
     * @type {import("../../../lib").StandardAdvice<
     *   null,
     *   import("../../../lib").Valuation,
     * >}
     */
    const advice = {
      "eval@before": (_state, context, code, path) =>
        instrumentDeep({ code, path, context }),
    };
    const { instrumentRoot, instrumentDeep } = setupBasicMembrane({
      global_declarative_record: "builtin",
      initial: null,
      record,
      context,
      warning,
      aspect: {
        type: "standard",
        pointcut: ["eval@before"],
        advice,
      },
    });
    return instrumentRoot;
  },
};

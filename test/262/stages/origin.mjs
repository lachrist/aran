/* eslint-disable local/no-deep-import */

import { setupAranBasic, setupStandardAdvice } from "../aran/index.mjs";
import { makeOriginAdvice } from "../../aspects/origin.mjs";

const {
  Object: { hasOwn },
} = globalThis;

/** @type {import("../stage").Stage} */
export default {
  precursor: ["identity", "parsing", "bare-basic-builtin-standard"],
  negative: [],
  exclude: [],
  listLateNegative: (_target, _metadata, _error) => [],
  compileInstrument: ({ report, record, warning, context }) => {
    const { instrumentRoot, instrumentDeep, intrinsics } = setupAranBasic({
      global_declarative_record: "builtin",
      initial_state: {
        parent: null,
        frame: { __proto__: null },
        stack: [],
      },
      record,
      report,
      context,
      warning,
      // eslint-disable-next-line no-use-before-define
      standard_pointcut: (kind, _path) => hasOwn(advice, kind),
      flexible_pointcut: null,
    });
    const advice = makeOriginAdvice({
      intrinsics,
      instrumentDeep: (...args) => instrumentDeep(...args),
    });
    setupStandardAdvice(context, advice);
    return instrumentRoot;
  },
};

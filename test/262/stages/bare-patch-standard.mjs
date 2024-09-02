import { setupAranPatch, setupStandardAdvice } from "../aran/index.mjs";
import bare from "./bare.mjs";

/**
 * @type {import("../stage").Stage}
 */
export default {
  ...bare,
  listLateNegative: (_target, _metadata, error) =>
    error.layer === "meta" && error.name === "AranEvalError"
      ? ["direct-eval-call"]
      : [],
  compileInstrument: ({ report, record, warning, context }) => {
    setupStandardAdvice(context, {});
    const { instrumentRoot } = setupAranPatch({
      global_declarative_record: "emulate",
      initial_state: null,
      report,
      record,
      context,
      warning,
      flexible_pointcut: null,
      standard_pointcut: [],
    });
    return instrumentRoot;
  },
};

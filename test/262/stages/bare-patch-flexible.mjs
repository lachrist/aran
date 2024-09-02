import { setupAranPatch, setupFlexibleAspect } from "../aran/index.mjs";
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
    setupFlexibleAspect(context, {});
    const { instrumentRoot } = setupAranPatch({
      global_declarative_record: "emulate",
      initial_state: null,
      report,
      record,
      context,
      warning,
      flexible_pointcut: {},
      standard_pointcut: null,
    });
    return instrumentRoot;
  },
};

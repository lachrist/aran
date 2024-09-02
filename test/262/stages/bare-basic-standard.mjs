import { setupAranBasic, setupStandardAdvice } from "../aran/index.mjs";
import bare from "./bare.mjs";

/**
 * @type {import("../stage").Stage}
 */
export default {
  ...bare,
  listLateNegative: (_target, _metadata, _error) => [],
  compileInstrument: ({ report, record, warning, context }) => {
    const { instrumentRoot, instrumentDeep } = setupAranBasic({
      standard_pointcut: ["eval@before"],
      flexible_pointcut: null,
      global_declarative_record: "builtin",
      initial_state: null,
      report,
      record,
      context,
      warning,
    });
    /**
     * @type {import("../../../lib").StandardAdvice<
     *   null,
     *   { Stack: unknown, Scope: unknown, Other: unknown },
     * >}
     */
    const advice = {
      "eval@before": (_state, situ, code, path) =>
        typeof code === "string" ? instrumentDeep(code, path, situ) : code,
    };
    setupStandardAdvice(context, advice);
    return instrumentRoot;
  },
};

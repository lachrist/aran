import {
  setupAranBasic,
  setupStandardAdvice,
  toStandardPointcut,
} from "../aran/index.mjs";
import bare from "./bare.mjs";

/**
 * @type {import("../stage").Stage}
 */
export default {
  ...bare,
  listLateNegative: (_target, _metadata, _error) => [],
  compileInstrument: ({ report, record, warning, context }) => {
    /**
     * @type {import("../../../lib").StandardAdvice<
     *   null,
     *   { Stack: unknown, Scope: unknown, Other: unknown },
     * >}
     */
    const advice = {
      "eval@before": (_state, context, code, path) =>
        // eslint-disable-next-line no-use-before-define
        typeof code === "string" ? instrumentDeep(code, path, context) : code,
    };
    setupStandardAdvice(context, advice);
    const { instrumentRoot, instrumentDeep } = setupAranBasic({
      standard_pointcut: toStandardPointcut(advice),
      flexible_pointcut: null,
      global_declarative_record: "builtin",
      initial_state: null,
      report,
      record,
      context,
      warning,
    });
    return instrumentRoot;
  },
};

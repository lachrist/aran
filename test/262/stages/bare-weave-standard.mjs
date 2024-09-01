import {
  setupAranWeave,
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
      "apply@around": (_state, callee, self, input, _path) =>
        // eslint-disable-next-line no-use-before-define
        apply(callee, self, input),
      "construct@around": (_state, callee, input, _path) =>
        // eslint-disable-next-line no-use-before-define
        construct(callee, input),
    };
    setupStandardAdvice(context, advice);
    const { instrumentDeep, instrumentRoot, apply, construct } = setupAranWeave(
      {
        global_declarative_record: "emulate",
        initial_state: null,
        report,
        record,
        context,
        warning,
        flexible_pointcut: null,
        standard_pointcut: toStandardPointcut(advice),
      },
    );
    return instrumentRoot;
  },
};

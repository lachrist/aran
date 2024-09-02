import { setupAranWeave, setupStandardAdvice } from "../aran/index.mjs";
import bare from "./bare.mjs";

/**
 * @type {import("../stage").Stage}
 */
export default {
  ...bare,
  listLateNegative: (_target, _metadata, _error) => [],
  compileInstrument: ({ report, record, warning, context }) => {
    const { instrumentDeep, instrumentRoot, apply, construct } = setupAranWeave(
      {
        global_declarative_record: "emulate",
        initial_state: null,
        report,
        record,
        context,
        warning,
        flexible_pointcut: null,
        standard_pointcut: ["eval@before", "apply@around", "construct@around"],
      },
    );
    /**
     * @type {import("../../../lib").StandardAdvice<
     *   null,
     *   { Stack: unknown, Scope: unknown, Other: unknown },
     * >}
     */
    const advice = {
      "eval@before": (_state, situ, code, path) =>
        typeof code === "string" ? instrumentDeep(code, path, situ) : code,
      "apply@around": (_state, callee, self, input, _path) =>
        apply(callee, self, input),
      "construct@around": (_state, callee, input, _path) =>
        construct(callee, input),
    };
    setupStandardAdvice(context, advice);
    return instrumentRoot;
  },
};
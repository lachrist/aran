import { setupAranWeave, setupFlexibleAspect } from "../aran/index.mjs";
import bare from "./bare.mjs";

/**
 * @type {import("../stage").Stage}
 */
export default {
  ...bare,
  listLateNegative: (_target, _metadata, _error) => [],
  compileInstrument: ({ report, record, warning, context }) => {
    /**
     * @type {import("../../../lib").HeterogeneousFlexibleAspect<
     *   null,
     *   unknown,
     *   {
     *     _ARAN_EVAL_BEFORE_: [import("../../../lib").Path],
     *     _ARAN_APPLY_AROUND_: [],
     *     _ARAN_CONSTRUCT_AROUND_: [],
     *   },
     * >}
     */
    const aspect = {
      _ARAN_EVAL_BEFORE_: {
        kind: "eval@before",
        pointcut: ({ tag: path }) => [path],
        advice: (_state, code, situ, path) =>
          // eslint-disable-next-line no-use-before-define
          typeof code === "string" ? instrumentDeep(code, path, situ) : code,
      },
      _ARAN_APPLY_AROUND_: {
        kind: "apply@around",
        pointcut: (_node) => [],
        // eslint-disable-next-line no-use-before-define
        advice: (_state, callee, self, input) => apply(callee, self, input),
      },
      _ARAN_CONSTRUCT_AROUND_: {
        kind: "construct@around",
        pointcut: (_node) => [],
        // eslint-disable-next-line no-use-before-define
        advice: (_state, callee, input) => construct(callee, input),
      },
    };
    const { instrumentDeep, instrumentRoot, apply, construct } = setupAranWeave(
      {
        global_declarative_record: "emulate",
        initial_state: null,
        report,
        record,
        context,
        warning,
        flexible_pointcut: aspect,
        standard_pointcut: null,
      },
    );
    setupFlexibleAspect(context, aspect);
    return instrumentRoot;
  },
};

import { setupAranBasic, setupFlexibleAspect } from "../aran/index.mjs";
import bare from "./bare.mjs";

/**
 * @type {import("../stage").Stage}
 */
export default {
  ...bare,
  listLateNegative: (_target, _metadata, _error) => [],
  compileInstrument: ({ report, record, warning, context }) => {
    /**
     * @type {import("../../../lib").HomogeneousFlexibleAspect<
     *   null,
     *   unknown,
     *   [import("../../../lib").Path],
     * >}
     */
    const aspect = {
      _ARAN_EVAL_BEFORE_: {
        kind: "eval@before",
        pointcut: ({ tag: path }) => [path],
        advice: (_state, code, context, path) =>
          // eslint-disable-next-line no-use-before-define
          typeof code === "string" ? instrumentDeep(code, path, context) : code,
      },
    };
    setupFlexibleAspect(context, aspect);
    const { instrumentRoot, instrumentDeep } = setupAranBasic({
      global_declarative_record: "builtin",
      initial_state: null,
      report,
      record,
      context,
      warning,
      flexible_pointcut: aspect,
      standard_pointcut: null,
    });
    return instrumentRoot;
  },
};

import { setupAranPatch, setupFlexibleAspect } from "../aran/index.mjs";
import bare from "./bare.mjs";

/**
 * @type {import("../stage").Stage}
 */
export default {
  ...bare,
  listLateNegative: (_target, _metadata, error) =>
    error.layer === "meta" && error.name === "AranPatchError"
      ? ["patch-membrane"]
      : [],
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
    const { instrumentDeep, instrumentRoot } = setupAranPatch({
      global_declarative_record: "emulate",
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

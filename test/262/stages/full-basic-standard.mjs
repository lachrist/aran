import { setupAranBasic, setupStandardAdvice } from "../aran/index.mjs";
import bare from "./bare.mjs";

/**
 * @type {import("../stage").Stage}
 */
export default {
  ...bare,
  listLateNegative: (_target, _metadata, _error) => [],
  compileInstrument: ({ report, record, warning, context }) => {
    const {
      intrinsics: {
        undefined,
        "Reflect.apply": apply,
        "Reflect.construct": construct,
      },
      instrumentRoot,
      instrumentDeep,
    } = setupAranBasic({
      standard_pointcut: true,
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
      "block@setup": (state, _kind, _path) => state,
      "program-block@definition": (_state, _kind, _head, _path) => undefined,
      "control-block@labeling": (_state, _kind, _labels) => undefined,
      "block@declaration": (_state, _kind, _frame, _path) => undefined,
      "block@declaration-overwrite": (_state, _kind, frame, _path) => frame,
      "generator-block@suspension": (_state, _kind, _path) => undefined,
      "generator-block@resumption": (_state, _kind, _path) => undefined,
      "control-block@completion": (_state, _kind, _path) => undefined,
      "routine-block@completion": (_state, _kind, value, _path) => value,
      "block@throwing": (_state, _kind, value, _path) => value,
      "block@teardown": (_state, _kind, _path) => undefined,
      "break@before": (_state, _label, _path) => undefined,
      "test@before": (_state, _kind, value, _path) => !!value,
      "intrinsic@after": (_state, _name, value, _path) => value,
      "primitive@after": (_state, value, _path) => value,
      "import@after": (_state, _source, _specifier, value, _path) => value,
      "closure@after": (_state, _kind, value, _path) => value,
      "read@after": (_state, _variable, value, _path) => value,
      "eval@before": (_state, situ, code, path) =>
        typeof code === "string" ? instrumentDeep(code, path, situ) : code,
      "eval@after": (_state, value, _path) => value,
      "await@before": (_state, value, _path) => value,
      "await@after": (_state, value, _path) => value,
      "yield@before": (_state, _delegate, value, _path) => value,
      "yield@after": (_state, _delegate, value, _path) => value,
      "drop@before": (_state, value, _path) => value,
      "export@before": (_state, _specifier, value, _path) => value,
      "write@before": (_state, _variable, value, _path) => value,
      "apply@around": (_state, callee, self, input, _path) =>
        apply(/** @type {Function} */ (callee), self, input),
      "construct@around": (_state, callee, input, _path) =>
        construct(/** @type {Function} */ (callee), input),
    };
    setupStandardAdvice(context, advice);
    return instrumentRoot;
  },
};

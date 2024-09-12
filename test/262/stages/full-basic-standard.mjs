import {
  instrument,
  setupAranBasic,
  setupStandardAdvice,
} from "../aran/index.mjs";

const { undefined } = globalThis;

/**
 * @type {(
 *   membrane: import("../aran/membrane").BasicMembrane,
 * ) => import("../../../lib").StandardAdvice<
 *   null,
 *   { Stack: unknown, Scope: unknown, Other: unknown },
 * >}
 */
const makeAdvice = ({ intrinsics, instrumentLocalEvalCode }) => ({
  "block@setup": (state, _kind, _path) => state,
  "program-block@before": (_state, _kind, _head, _path) => undefined,
  "closure-block@before": (_state, _kind, _path) => undefined,
  "control-block@before": (_state, _kind, _labels) => undefined,
  "block@declaration": (_state, _kind, _frame, _path) => undefined,
  "block@declaration-overwrite": (_state, _kind, frame, _path) => frame,
  "generator-block@suspension": (_state, _kind, _path) => undefined,
  "generator-block@resumption": (_state, _kind, _path) => undefined,
  "program-block@after": (_state, _kind, value, _path) => value,
  "closure-block@after": (_state, _kind, value, _path) => value,
  "control-block@after": (_state, _kind, _path) => undefined,
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
    typeof code === "string" ? instrumentLocalEvalCode(code, path, situ) : code,
  "eval@after": (_state, value, _path) => value,
  "await@before": (_state, value, _path) => value,
  "await@after": (_state, value, _path) => value,
  "yield@before": (_state, _delegate, value, _path) => value,
  "yield@after": (_state, _delegate, value, _path) => value,
  "drop@before": (_state, value, _path) => value,
  "export@before": (_state, _specifier, value, _path) => value,
  "write@before": (_state, _variable, value, _path) => value,
  "apply@around": (_state, callee, self, input, _path) =>
    intrinsics["Reflect.apply"](/** @type {Function} */ (callee), self, input),
  "construct@around": (_state, callee, input, _path) =>
    intrinsics["Reflect.construct"](/** @type {Function} */ (callee), input),
});

/**
 * @type {import("../aran/config").Config}
 */
const config = {
  selection: "main",
  global_declarative_record: "builtin",
  initial_state: null,
  flexible_pointcut: null,
  standard_pointcut: true,
};

/**
 * @type {import("../stage").Stage}
 */
export default {
  precursor: ["identity", "parsing", "bare-basic-flexible"],
  negative: [],
  exclude: [],
  listLateNegative: (_target, _metadata, _error) => [],
  setup: (context) => {
    setupStandardAdvice(context, makeAdvice(setupAranBasic(context)));
  },
  instrument: (source) => instrument(source, config),
};

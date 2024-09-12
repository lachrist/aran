import {
  setupStandardAdvice,
  instrument,
  setupAranBasic,
} from "../aran/index.mjs";
import bare from "./bare.mjs";

/**
 * @type {(
 *   membrane: import("../aran/membrane").BasicMembrane,
 * ) => import("../../../lib").StandardAdvice<
 *   null,
 *   { Stack: unknown, Scope: unknown, Other: unknown },
 * >}
 */
const makeAdvice = ({ instrumentLocalEvalCode }) => ({
  "eval@before": (_state, situ, code, path) =>
    typeof code === "string" ? instrumentLocalEvalCode(code, path, situ) : code,
});

/**
 * @type {import("../aran/config").Config}
 */
const config = {
  selection: ["main", "local"],
  global_declarative_record: "builtin",
  initial_state: null,
  standard_pointcut: ["eval@before"],
  flexible_pointcut: null,
};

/**
 * @type {import("../stage").Stage}
 */
export default {
  ...bare,
  listLateNegative: (_target, _metadata, _error) => [],
  setup: (context) => {
    setupStandardAdvice(context, makeAdvice(setupAranBasic(context)));
  },
  instrument: (source) => instrument(source, config),
};

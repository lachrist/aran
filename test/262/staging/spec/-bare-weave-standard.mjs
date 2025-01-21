import {
  instrument,
  setupAranWeave,
  setupStandardAdvice,
} from "../aran/index.mjs";
import bare from "./bare.mjs";

/**
 * @type {(
 *   membrane: import("../aran/membrane").WeaveMembrane,
 * ) => import("aran").StandardAdvice<
 *   import("../aran/config").NodeHash,
 *   null,
 *   { Stack: unknown, Scope: unknown, Other: unknown },
 * >}
 */
const makeAdvice = ({ weaveLocalEval, apply, construct }) => ({
  "eval@before": (_state, root, _path) =>
    weaveLocalEval(/** @type {any} */ (root)),
  "apply@around": (_state, callee, self, input, _path) =>
    apply(callee, self, input),
  "construct@around": (_state, callee, input, _path) =>
    construct(callee, input),
});

/**
 * @type {import("../aran/config").Config}
 */
const config = {
  selection: "*",
  global_declarative_record: "emulate",
  initial_state: null,
  flexible_pointcut: null,
  standard_pointcut: ["eval@before", "apply@around", "construct@around"],
};

/**
 * @type {import("../stage").Stage}
 */
export default {
  ...bare,
  negative: [
    ...bare.negative,
    "dynamic-function-string-representation",
    "global-object-access",
  ],
  listLateNegative: (_target, _metadata, _error) => [],
  setup: (context) => {
    const membrane = setupAranWeave(context);
    const advice = makeAdvice(membrane);
    setupStandardAdvice(context, advice);
  },
  instrument: (source) => instrument(source, config),
};

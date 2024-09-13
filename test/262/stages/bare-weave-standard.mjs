import {
  instrument,
  setupAranWeave,
  setupStandardAdvice,
} from "../aran/index.mjs";
import bare from "./bare.mjs";

/**
 * @type {(
 *   membrane: import("../aran/membrane").WeaveMembrane,
 * ) => import("../../../lib").StandardAdvice<
 *   null,
 *   { Stack: unknown, Scope: unknown, Other: unknown },
 * >}
 */
const makeAdvice = ({ instrumentLocalEvalCode, apply, construct }) => ({
  "eval@before": (_state, situ, code, path) =>
    typeof code === "string" ? instrumentLocalEvalCode(code, path, situ) : code,
  "apply@around": (_state, callee, self, input, _path) =>
    apply(callee, self, input),
  "construct@around": (_state, callee, input, _path) =>
    construct(callee, input),
  // "apply@around": (_state, callee, self, input, _path) => {
  //   console.log("apply", { callee, self, input });
  //   try {
  //     const result = apply(callee, self, input);
  //     console.log("result", { callee, self, input, result });
  //     return result;
  //   } catch (error) {
  //     console.log("error", { callee, self, input, error });
  //     throw error;
  //   }
  // },
  // "construct@around": (_state, callee, input, _path) => {
  //   console.log("apply", { callee, input });
  //   try {
  //     const result = construct(callee, input);
  //     console.log("result", { callee, input, result });
  //     return result;
  //   } catch (error) {
  //     console.log("error", { callee, input, error });
  //     throw error;
  //   }
  // },
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
  listLateNegative: (_target, _metadata, _error) => [],
  setup: (context) => {
    setupStandardAdvice(context, makeAdvice(setupAranWeave(context)));
  },
  instrument: (source) => instrument(source, config),
};

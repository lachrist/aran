import {
  DUMMY_WEAVE_MEMBRANE,
  instrument,
  setupAranWeave,
  setupFlexibleAspect,
} from "../aran/index.mjs";
import bare from "./bare.mjs";

/**
 * @type {(
 *   membrane: import("../aran/membrane").WeaveMembrane,
 * ) => import("../../../").HomogeneousFlexibleAspect<
 *   import("../aran/config").NodeHash,
 *   null,
 *   unknown,
 *   [],
 * >}
 */
const makeAspect = ({ instrumentLocalEvalCode, apply, construct }) => ({
  _ARAN_EVAL_BEFORE_: {
    kind: "eval@before",
    pointcut: (_node, _parent, _root) => [],
    advice: (_state, code, situ) =>
      typeof code === "string" ? instrumentLocalEvalCode(code, situ) : code,
  },
  _ARAN_APPLY_AROUND_: {
    kind: "apply@around",
    pointcut: (_node, _parent, _root) => [],
    advice: (_state, callee, self, input) => apply(callee, self, input),
  },
  _ARAN_CONSTRUCT_AROUND_: {
    kind: "construct@around",
    pointcut: (_node, _parent, _root) => [],
    advice: (_state, callee, input) => construct(callee, input),
  },
});

/** @type {import("../aran/config").Config} */
const config = {
  selection: "*",
  global_declarative_record: "emulate",
  initial_state: null,
  flexible_pointcut: makeAspect(DUMMY_WEAVE_MEMBRANE),
  standard_pointcut: null,
};

/**
 * @type {import("../stage").Stage}
 */
export default {
  ...bare,
  listLateNegative: (_target, _metadata, _error) => [],
  setup: (context) => {
    setupFlexibleAspect(context, makeAspect(setupAranWeave(context)));
  },
  instrument: (source) => instrument(source, config),
};

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
 * ) => import("aran").HomogeneousFlexibleAspect<
 *   import("../aran/config").Atom,
 *   null,
 *   unknown,
 *   [],
 * >}
 */
const makeAspect = ({ weaveLocalEval, apply, construct }) => ({
  _ARAN_EVAL_BEFORE_: {
    kind: "eval@before",
    pointcut: (_node, _parent, _root) => [],
    advice: (_state, root) => weaveLocalEval(/** @type {any} */ (root)),
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
    const menbrane = setupAranWeave(context);
    const aspect = makeAspect(menbrane);
    setupFlexibleAspect(context, aspect);
  },
  instrument: (source) => instrument(source, config),
};

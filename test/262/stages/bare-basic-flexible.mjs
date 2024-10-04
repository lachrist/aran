import {
  DUMMY_BASIC_MEMBRANE,
  instrument,
  setupAranWeave,
  setupFlexibleAspect,
} from "../aran/index.mjs";
import bare from "./bare.mjs";

/**
 * @type {(
 *   membrane: import("../aran/membrane").BasicMembrane,
 * ) => import("../../../").HomogeneousFlexibleAspect<
 *   import("../aran/config").NodeHash,
 *   null,
 *   unknown,
 *   [],
 * >}
 */
const makeAspect = ({ instrumentLocalEvalCode }) => ({
  _ARAN_EVAL_BEFORE_: {
    kind: "eval@before",
    pointcut: (_node, _parent, _root) => [],
    advice: (_state, code, situ) =>
      typeof code === "string" ? instrumentLocalEvalCode(code, situ) : code,
  },
});

/** @type {import("../aran/config").Config} */
const config = {
  selection: ["main", "local"],
  global_declarative_record: "builtin",
  initial_state: null,
  flexible_pointcut: makeAspect(DUMMY_BASIC_MEMBRANE),
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

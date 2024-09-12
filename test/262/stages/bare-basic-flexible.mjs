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
 * ) => import("../../../lib").HomogeneousFlexibleAspect<
 *   null,
 *   unknown,
 *   [import("../../../lib").Path],
 * >}
 */
const makeAspect = ({ instrumentLocalEvalCode }) => ({
  _ARAN_EVAL_BEFORE_: {
    kind: "eval@before",
    pointcut: ({ tag: path }) => [path],
    advice: (_state, code, situ, path) =>
      typeof code === "string"
        ? instrumentLocalEvalCode(code, path, situ)
        : code,
  },
});

/** @type {import("../aran/config").Config} */
const config = {
  selection: "main",
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

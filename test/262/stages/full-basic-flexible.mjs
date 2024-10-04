import {
  DUMMY_BASIC_MEMBRANE,
  instrument,
  setupAranBasic,
  setupFlexibleAspect,
} from "../aran/index.mjs";

const { undefined } = globalThis;

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
const makeAspect = ({ intrinsics, instrumentLocalEvalCode }) => {
  /**
   * @type {(
   *   node: import("../../../").AranNode<import("../aran/config").NodeHash>,
   *   parent: import("../../../").AranNode<import("../aran/config").NodeHash>,
   *   root: import("../../../").AranNode<import("../aran/config").NodeHash>,
   * ) => []}
   */
  const pointcut = (_node, _parent, _root) => [];
  return {
    _ARAN_BLOCK_SETUP_: {
      kind: "block@setup",
      pointcut,
      advice: (state) => state,
    },
    _ARAN_BLOCK_BEFORE_: {
      kind: "block@before",
      pointcut,
      advice: (_state) => undefined,
    },
    _ARAN_BLOCK_DECLARATION_: {
      kind: "block@declaration",
      pointcut,
      advice: (_state, _frame) => undefined,
    },
    _ARAN_BLOCK_DECLARATION_OVERWRITE_: {
      kind: "block@declaration-overwrite",
      pointcut,
      advice: (_state, frame) => frame,
    },
    _ARAN_PROGRAM_BLOCK_AFTER_: {
      kind: "program-block@after",
      pointcut,
      advice: (_state, value) => value,
    },
    _ARAN_CLOSURE_BLOCK_AFTER_: {
      kind: "closure-block@after",
      pointcut,
      advice: (_state, value) => value,
    },
    _ARAN_CONTROL_BLOCK_AFTER_: {
      kind: "control-block@after",
      pointcut,
      advice: (_state) => undefined,
    },
    _ARAN_BLOCK_THROWING_: {
      kind: "block@throwing",
      pointcut,
      advice: (_state, value) => value,
    },
    _ARAN_BLOCK_TEARDOWN_: {
      kind: "block@teardown",
      pointcut,
      advice: (_state) => undefined,
    },
    _ARAN_STATEMENT_BEFORE_: {
      kind: "statement@before",
      pointcut,
      advice: (_state) => undefined,
    },
    _ARAN_STATEMENT_AFTER_: {
      kind: "statement@after",
      pointcut,
      advice: (_state) => undefined,
    },
    _ARAN_EFFECT_BEFORE_: {
      kind: "effect@before",
      pointcut,
      advice: (_state) => undefined,
    },
    _ARAN_EFFECT_AFTER_: {
      kind: "effect@after",
      pointcut,
      advice: (_state) => undefined,
    },
    _ARAN_EXPRESSION_BEFORE_: {
      kind: "expression@before",
      pointcut,
      advice: (_state) => undefined,
    },
    _ARAN_EXPRESSION_AFTER_: {
      kind: "expression@after",
      pointcut,
      advice: (_state, value) => value,
    },
    _ARAN_EVAL_BEFORE_: {
      kind: "eval@before",
      pointcut,
      advice: (_state, code, situ) =>
        typeof code === "string" ? instrumentLocalEvalCode(code, situ) : code,
    },
    _ARAN_APPLY_AROUND_: {
      kind: "apply@around",
      pointcut,
      advice: (_state, callee, self, input) =>
        intrinsics["Reflect.apply"](
          /** @type {Function} */ (callee),
          self,
          input,
        ),
    },
    _ARAN_CONSTRUCT_AROUND_: {
      kind: "construct@around",
      pointcut,
      advice: (_state, callee, input) =>
        intrinsics["Reflect.construct"](
          /** @type {Function} */ (callee),
          input,
        ),
    },
  };
};

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
  precursor: ["identity", "parsing", "bare-basic-flexible"],
  negative: [],
  exclude: [],
  listLateNegative: (_target, _metadata, _error) => [],
  setup: (context) => {
    setupFlexibleAspect(context, makeAspect(setupAranBasic(context)));
  },
  instrument: (source) => instrument(source, config),
};

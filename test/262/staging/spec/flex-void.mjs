import { weaveFlexible } from "aran";
import { compileAran } from "../aran.mjs";
import { record } from "../../record/index.mjs";
import { listStageFailure } from "../failure.mjs";
import { toTestSpecifier } from "../../result.mjs";

const {
  Reflect: { defineProperty },
} = globalThis;

const { setup, trans, retro } = compileAran(
  {
    mode: "normal",
    escape_prefix: "__aran__",
    global_object_variable: "globalThis",
    intrinsic_global_variable: "__intrinsic__",
    global_declarative_record: "builtin",
    digest: (_node, node_path, file_path, _kind) => `${file_path}:${node_path}`,
  },
  (hash) => `dynamic://eval/local/${hash}`,
);

const ADVICE_VARIABLE = "__aran_eval_before__";

/**
 * @type {import("aran").FlexibleAspect}
 */
const aspect = {
  [ADVICE_VARIABLE]: {
    kind: "expression@after",
    pointcut: (_node, parent, _root) =>
      parent.type === "EvalExpression" ? [] : null,
    advice: (_state, result) =>
      // eslint-disable-next-line no-use-before-define
      weaveFlexible(/** @type {import("aran").Program<any>} */ (result), conf),
  },
};

/**
 * @type {import("aran").FlexibleWeaveConfig}
 */
const conf = {
  initial_state: null,
  pointcut: aspect,
};

////////////
// Export //
////////////

const precursor = "bare-main";

const exclusion = await listStageFailure(precursor);

/**
 * @type {import("../stage").Stage<null>}
 */
export default {
  // eslint-disable-next-line require-await
  setup: async (test) => {
    const specifier = toTestSpecifier(test.path, test.directive);
    if (exclusion.has(specifier)) {
      return {
        type: "exclude",
        reasons: [precursor],
      };
    } else {
      return {
        type: "include",
        state: null,
        flaky: false,
        negatives: [],
      };
    }
  },
  prepare: (_state, context) => {
    const { intrinsics } = setup(context);
    defineProperty(intrinsics["aran.global_object"], ADVICE_VARIABLE, {
      // @ts-ignore
      __proto__: null,
      value: aspect[ADVICE_VARIABLE].advice,
      enumerable: false,
      writable: false,
      configurable: false,
    });
  },
  instrument: ({ type, kind, path, content }) =>
    record({
      path,
      content:
        type === "main"
          ? retro(weaveFlexible(trans(path, kind, content), conf))
          : content,
    }),
  teardown: async (_state) => {},
};

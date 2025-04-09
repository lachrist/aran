import { weaveFlexible } from "aran";
import { compileAran } from "../aran.mjs";
import { record } from "../../record/index.mjs";
import { compileListPrecursorFailure } from "../failure.mjs";

const {
  Reflect: { defineProperty },
} = globalThis;

const { prepare, trans, retro } = compileAran(
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

const listPrecursorFailure = await compileListPrecursorFailure(["bare-main"]);

/**
 * @type {import("../stage.d.ts").Stage<
 *   import("../stage.d.ts").Config,
 *   import("../stage.d.ts").Config,
 * >}
 */
export default {
  // eslint-disable-next-line require-await
  open: async (config) => config,
  close: async (_config) => {},
  // eslint-disable-next-line require-await
  setup: async (config, [index, _test]) => {
    const reasons = listPrecursorFailure(index);
    if (reasons.length > 0) {
      return { type: "exclude", reasons };
    } else {
      return {
        type: "include",
        state: config,
        flaky: false,
        negatives: [],
      };
    }
  },
  prepare: (config, context) => {
    const { intrinsics } = prepare(context, config);
    defineProperty(intrinsics["aran.global_object"], ADVICE_VARIABLE, {
      // @ts-ignore
      __proto__: null,
      value: aspect[ADVICE_VARIABLE].advice,
      enumerable: false,
      writable: false,
      configurable: false,
    });
  },
  instrument: ({ record_directory }, { type, kind, path, content }) =>
    record(
      {
        path,
        content:
          type === "main"
            ? retro(weaveFlexible(trans(path, kind, content), conf))
            : content,
      },
      record_directory,
    ),
  teardown: async (_state) => {},
};

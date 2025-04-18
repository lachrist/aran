import { weaveStandard } from "aran";
import { compileAran } from "../aran.mjs";
import { record } from "../../record/index.mjs";
import { compileListPrecursorFailure } from "../failure.mjs";

const {
  Reflect: { defineProperty },
} = globalThis;

/**
 * @type {import("aran").Digest}
 */
const digest = (_node, node_path, file_path, _kind) =>
  `${file_path}:${node_path}`;

/**
 * @type {(hash: string) => string}
 */
const toEvalPath = (hash) => `dynamic://eval/local/${hash}`;

const { prepare, trans, retro } = compileAran(
  {
    mode: "normal",
    escape_prefix: "__aran__",
    global_object_variable: "globalThis",
    intrinsic_global_variable: "__intrinsic__",
    global_declarative_record: "builtin",
    digest,
  },
  toEvalPath,
);

const advice_global_variable = "__aran_advice__";

/**
 * @type {import("aran").StandardWeaveConfig<{Tag: import("aran").Json}>}
 */
const conf = {
  advice_global_variable,
  initial_state: null,
  pointcut: ["eval@before"],
};

/**
 * @type {import("aran").StandardAdvice}
 */
const advice = {
  "eval@before": (_state, root, _tag) =>
    weaveStandard(
      /** @type {import("aran").Program<import("aran").Atom & {Tag: string}>} */ (
        root
      ),
      conf,
    ),
};

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
    const descriptor = {
      __proto__: null,
      value: advice,
      enumerable: false,
      writable: false,
      configurable: false,
    };
    defineProperty(
      intrinsics["aran.global_object"],
      advice_global_variable,
      descriptor,
    );
  },
  instrument: ({ record_directory }, { type, kind, path, content }) =>
    record(
      {
        path,
        content:
          type === "main"
            ? retro(weaveStandard(trans(path, kind, content), conf))
            : content,
      },
      record_directory,
    ),
  teardown: async (_state) => {},
};

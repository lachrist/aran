import { weaveStandard } from "aran";
import { compileAran } from "../aran.mjs";
import { record } from "../../record/index.mjs";
import { toTestSpecifier } from "../../result.mjs";
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

const { setup, trans, retro } = compileAran(
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

const ADVICE_VARIABLE = "__aran_advice__";

/**
 * @type {import("aran").StandardWeaveConfig<{Tag: import("aran").Json}>}
 */
const conf = {
  advice_global_variable: ADVICE_VARIABLE,
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
 * @type {import("../stage").Stage<null>}
 */
export default {
  // eslint-disable-next-line require-await
  setup: async (test) => {
    const specifier = toTestSpecifier(test.path, test.directive);
    const reasons = listPrecursorFailure(specifier);
    if (reasons.length > 0) {
      return { type: "exclude", reasons };
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
      value: advice,
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
          ? retro(weaveStandard(trans(path, kind, content), conf))
          : content,
    }),
  teardown: async (_state) => {},
};

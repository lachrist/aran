import { weaveFlexible } from "aran";
import { compileAran } from "../aran.mjs";
import { record } from "../../record/index.mjs";

const {
  Reflect: { defineProperty },
} = globalThis;

/**
 * @type {import("aran").Digest<string>}
 */
const digest = (_node, node_path, file_path, _kind) =>
  /** @type {string} */ (`${file_path}:${node_path}`);

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

const ADVICE_VARIABLE = "__aran_eval_before__";

/**
 * @type {import("aran").FlexibleWeaveConfig<[], null>}
 */
const conf = {
  initial_state: null,
  pointcut: {
    [ADVICE_VARIABLE]: {
      kind: "eval@before",
      pointcut: (_node, _parent, _root) => [],
    },
  },
};

/**
 * @type {import("aran").FlexibleAdviceElement<[], null>}
 */
const advice = {
  kind: "eval@before",
  advice: (_state, root) =>
    weaveFlexible(/** @type {import("aran").Program<any>} */ (root), conf),
};

/**
 * @type {import("../stage").Stage}
 */
export default {
  precursor: ["bare-main"],
  negative: [],
  exclude: [],
  listLateNegative: (_test, _error) => [],
  setup: (context) => {
    const { intrinsics } = setup(context);
    defineProperty(intrinsics["aran.global"], ADVICE_VARIABLE, {
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
          ? retro(weaveFlexible(trans(path, kind, content), conf))
          : content,
    }),
};

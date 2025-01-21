import bare from "./bare.mjs";
import { compileAran } from "../aran.mjs";
import { weaveStandard } from "aran";

const {
  Reflect: { defineProperty },
} = globalThis;

const ADVICE_VARIABLE = "_aran_advice_";

/**
 * @type {import("aran").Digest<string, string>}
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
    global_variable: "globalThis",
    intrinsic_variable: "__intrinsic__",
    global_declarative_record: "builtin",
    digest,
  },
  toEvalPath,
);

/**
 * @type {import("aran").StandardWeaveConfig<string>}
 */
const conf = {
  advice_variable: ADVICE_VARIABLE,
  initial_state: null,
  pointcut: false,
};

/**
 * @type {import("aran").StandardAdvice<string, null>}
 */
const advice = {};

/**
 * @type {import("../stage").Stage}
 */
export default {
  ...bare,
  listLateNegative: (_target, _metadata, _error) => [],
  setup: (context) => {
    const { intrinsics } = setup(context);
    defineProperty(intrinsics["aran.global"], ADVICE_VARIABLE, {
      // @ts-ignore
      __proto__: null,
      value: advice,
      writable: false,
      enumerable: false,
      configurable: true,
    });
  },
  instrument: ({ type, kind, path, content }) => ({
    path,
    content:
      type === "main"
        ? retro(weaveStandard(trans(path, kind, content), conf))
        : content,
  }),
};

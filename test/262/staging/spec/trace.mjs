import { compileAran } from "../aran.mjs";
import { weaveStandard } from "aran";
import {
  advice_global_variable,
  weave_config,
  createTraceAdvice,
} from "../../../aspects/trace.mjs";
import { record } from "../../record/index.mjs";

const {
  Reflect: { defineProperty },
} = globalThis;

/**
 * @typedef {import("../../../aspects/trace.mjs").FilePath} FilePath
 * @typedef {import("../../../aspects/trace.mjs").NodeHash} NodeHash
 */

/**
 * @type {import("aran").Digest<{
 *   FilePath: FilePath,
 *   NodeHash: NodeHash,
 * }>}
 */
const digest = (_node, node_path, file_path, _kind) =>
  /** @type {NodeHash} */ (`${file_path}:${node_path}`);

/**
 * @type {(
 *   hash: NodeHash,
 * ) => FilePath}
 */
const toEvalPath = (hash) =>
  /** @type {FilePath} */ (`dynamic://eval/local/${hash}`);

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

/** @type {import("../stage").Stage} */
export default {
  precursor: ["stnd-full"],
  negative: [],
  exclude: [],
  listLateNegative: (_test, _error) => [],
  setup: (context) => {
    const { intrinsics } = setup(context);
    const global = intrinsics["aran.global_object"];
    const advice = createTraceAdvice(weaveStandard, {
      Reflect: {
        apply: /** @type {any} */ (global.Reflect.apply),
        construct: /** @type {any} */ (global.Reflect.construct),
      },
      Symbol: {
        keyFor: global.Symbol.keyFor,
      },
      console: {
        log: (_message) => {},
      },
    });
    defineProperty(intrinsics["aran.global_object"], advice_global_variable, {
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
          ? retro(
              weaveStandard(
                trans(
                  /** @type {FilePath} */ (/** @type {string} */ (path)),
                  kind,
                  content,
                ),
                weave_config,
              ),
            )
          : content,
    }),
};

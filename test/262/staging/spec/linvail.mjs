import { weave } from "../../../../../linvail/lib/instrument/_.mjs";
import { createRuntime } from "../../../../../linvail/lib/runtime/_.mjs";
import { compileListPrecursorFailure } from "../failure.mjs";
import { record } from "../../record/index.mjs";
import { compileAran } from "../aran.mjs";
import { toTestSpecifier } from "../../result.mjs";
import { loadTaggingList } from "../../tagging/index.mjs";

const {
  Reflect: { defineProperty },
  console: { dir },
} = globalThis;

globalThis.Error.stackTraceLimit = 1 / 0;

/**
 * @typedef {import("../../../../../linvail/lib/advice").Advice} Advice
 */

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

const advice_global_variable = "__ARAN_ADVICE__";

const listPrecursorFailure = await compileListPrecursorFailure(["stnd-full"]);

/**
 * @type {(
 *   advice: Advice,
 * ) => Advice}
 */
const supportDirectEval = (advice) => ({
  ...advice,
  weaveEvalProgram: (root) => weave(root, { advice_global_variable }),
});

const listNegative = await loadTaggingList(["proxy"]);

/**
 * @type {import("../stage").Stage<
 *   import("../stage").Config,
 *   import("../stage").Config,
 * >}
 */
export default {
  // eslint-disable-next-line require-await
  open: async (config) => config,
  close: async (_config) => {},
  // eslint-disable-next-line require-await
  setup: async (config, [index, { path, directive }]) => {
    const reasons = listPrecursorFailure(index);
    const specifier = toTestSpecifier(path, directive);
    if (reasons.length > 0) {
      return { type: "exclude", reasons };
    } else {
      return {
        type: "include",
        state: config,
        flaky: false,
        negatives: listNegative(specifier),
      };
    }
  },
  prepare: (config, context) => {
    const { intrinsics } = prepare(context, config);
    const { library, advice } = createRuntime(intrinsics, {
      dir: (value) => {
        dir(value, { showHidden: true, showProxy: true });
      },
    });
    {
      const descriptor = {
        __proto__: null,
        value: supportDirectEval(advice),
        enumerable: false,
        writable: false,
        configurable: false,
      };
      defineProperty(
        intrinsics["aran.global_object"],
        advice_global_variable,
        descriptor,
      );
    }
    {
      const descriptor = {
        __proto__: null,
        value: library,
        enumerable: false,
        writable: false,
        configurable: false,
      };
      defineProperty(intrinsics["aran.global_object"], "Linvail", descriptor);
    }
  },
  instrument: ({ record_directory }, { type, kind, path, content: code1 }) => {
    if (type === "main") {
      /** @type {import("aran").Program} */
      const root1 = trans(path, kind, code1);
      const root2 = weave(root1, { advice_global_variable });
      const code2 = retro(root2);
      return record({ path, content: code2 }, record_directory);
    } else {
      return record({ path, content: code1 }, record_directory);
    }
  },
  teardown: async (_state) => {},
};

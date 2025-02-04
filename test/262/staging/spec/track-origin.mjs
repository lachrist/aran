import { compileAran } from "../aran.mjs";
import {
  ADVICE_GLOBAL_VARIABLE,
  createTrackOriginAdvice,
  weave,
} from "../../../aspects/track-origin.mjs";
import { record } from "../../record/index.mjs";
import { toTestSpecifier } from "../../result.mjs";
import { compileListPrecursorFailure } from "../failure.mjs";

const {
  Reflect: { defineProperty },
} = globalThis;

/**
 * @type {import("aran").Digest<{FilePath: string, NodeHash: string}>}
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

const listPrecursorFailure = await compileListPrecursorFailure(["stnd-full"]);

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
  setup: async (config, test) => {
    const specifier = toTestSpecifier(test.path, test.directive);
    const reasons = listPrecursorFailure(specifier);
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
    const advice = createTrackOriginAdvice(
      /** @type {{apply: any, construct: any}} */ (
        intrinsics["aran.global_object"].Reflect
      ),
    );
    defineProperty(intrinsics["aran.global_object"], ADVICE_GLOBAL_VARIABLE, {
      // @ts-ignore
      __proto__: null,
      value: advice,
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
          type === "main" ? retro(weave(trans(path, kind, content))) : content,
      },
      record_directory,
    ),
  teardown: async (_state) => {},
};

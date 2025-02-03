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

const listPrecursorFailure = await compileListPrecursorFailure(["stnd-full"]);

/** @type {import("../stage").Stage<null>} */
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
  instrument: ({ type, kind, path, content }) =>
    record({
      path,
      content:
        type === "main" ? retro(weave(trans(path, kind, content))) : content,
    }),
  teardown: async (_state) => {},
};

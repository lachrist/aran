import { compileAran } from "../aran.mjs";
import {
  ADVICE_GLOBAL_VARIABLE,
  createTrackOriginAdvice,
  weave,
} from "../../../aspects/track-origin.mjs";
import { record } from "../../record/index.mjs";

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

/** @type {import("../stage").Stage} */
export default {
  precursor: ["stnd-full"],
  negative: [],
  exclude: [],
  listLateNegative: (_test, _error) => [],
  setup: (context) => {
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
};

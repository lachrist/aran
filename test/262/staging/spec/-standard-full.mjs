import bare from "./bare.mjs";
import { compileAran } from "../aran.mjs";
import { weaveStandard } from "aran";

const {
  Reflect: { defineProperty },
  Array: { isArray },
} = globalThis;

const ADVICE_VARIABLE = "_aran_advice_";

/**
 * @type {(
 *   arg: unknown
 * ) => boolean}
 */
const isTag = (tag) =>
  typeof tag === "string" &&
  tag.length > 4 &&
  tag[0] === "t" &&
  tag[1] === "a" &&
  tag[2] === "g" &&
  tag[3] === ":";

/**
 * @type {(
 *   arg: unknown,
 * ) => boolean}
 */
const isState = (state) => state === "state";

/**
 * @type {(
 *   arg: unknown
 * ) => boolean}
 */
const isObjectArray = (arg) => {
  if (!isArray(arg)) {
    return false;
  }
  const { length } = arg;
};

/**
 * @type {import("aran").Digest<string, string>}
 */
const digest = (_node, node_path, file_path, _kind) =>
  /** @type {string} */ (`tag:${file_path}:${node_path}`);

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
  pointcut: true,
};

/**
 * @type {import("aran").StandardAdvice<string, null>}
 */
const advice = {
  "block@setup": (_state, _kind, _tag) => {},
  "program-block@before": (_state, _kind, _head, _tag) => {},
  "closure-block@before": (_state, _kind, _tag) => {},
  "segment-block@before": (_state, _kind, _labels, _tag) => {},
  "block@declaration": (_state, _kind, _frame, _tag) => {},
  "block@declaration-overwrite": (_state, _kind, frame, _tag) => frame,
  "block@teardown": (_state, _kind, _tag) => {},
  "segment-block@after": (_state, _kind, _tag) => {},
  "program-block@after": (_state, _kind, value, _tag) => value,
  "closure-block@after": (_state, _kind, value, _tag) => value,
  "block@throwing": (_state, _kind, value, _tag) => value,
  "test@before": (_state, _kind, _tag) => {},
};

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

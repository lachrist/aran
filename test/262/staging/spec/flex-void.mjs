import { weaveFlexible } from "aran";
import { compileAran } from "../aran.mjs";

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

/**
 * @type {import("aran").FlexibleWeaveConfig}
 */
const conf = {
  initial_state: null,
  pointcut: {},
};

/**
 * @type {import("../stage").Stage}
 */
export default {
  precursor: ["bare-main"],
  negative: [],
  exclude: [],
  listLateNegative: (_test, _error) => [],
  setup,
  instrument: ({ type, kind, path, content }) => ({
    path,
    content:
      type === "main"
        ? retro(weaveFlexible(trans(path, kind, content), conf))
        : content,
  }),
};

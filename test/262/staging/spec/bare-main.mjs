import { record } from "../../record/index.mjs";
import { compileAran } from "../aran.mjs";

/**
 * @type {import("aran").Digest}
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
    escape_prefix: "$aran",
    global_object_variable: "globalThis",
    intrinsic_global_variable: "__aran_intrinsic__",
    global_declarative_record: "builtin",
    digest,
  },
  toEvalPath,
);

/**
 * @type {import("../stage").Stage}
 */
export default {
  precursor: ["parsing"],
  negative: [
    "module-literal-specifier",
    "async-iterator-async-value",
    "arguments-two-way-binding",
    "function-dynamic-property",
    "duplicate-constant-global-function",
    "negative-bare-unknown",
    "negative-bare-duplicate-super-prototype-access",
    "negative-bare-early-module-declaration",
    "negative-bare-missing-iterable-return-in-pattern",
    "negative-bare-wrong-realm-for-default-prototype",
  ],
  exclude: ["function-string-representation"],
  listLateNegative: (_test, _error) => [],
  setup,
  instrument: ({ type, kind, path, content }) =>
    record({
      path,
      content: type === "main" ? retro(trans(path, kind, content)) : content,
    }),
};

import bare from "./bare.mjs";
import { compileAran } from "../aran.mjs";

/**
 * @type {import("../../../lib").Digest<string, string>}
 */
const digest = (_node, node_path, file_path, _kind) =>
  /** @type {string} */ (`${file_path}:${node_path}`);

/**
 * @type {(hash: string) => string}
 */
const toEvalPath = (hash) => `eval:${hash}`;

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
 * @type {import("../stage").Stage}
 */
export default {
  ...bare,
  listLateNegative: (_target, _metadata, _error) => [],
  setup,
  instrument: ({ type, kind, path, content }) => ({
    path,
    content: type === "main" ? retro(trans(path, kind, content)) : content,
  }),
};

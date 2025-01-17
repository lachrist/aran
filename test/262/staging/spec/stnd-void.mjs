import { weaveStandard } from "../../../../lib";
import { compileAran } from "../aran.mjs";

/**
 * @type {import("../../../../lib").Digest<string, string>}
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

const ADVICE_VARIABLE = "aran.advice";

/**
 * @type {import("../../../../lib").StandardWeaveConfig<
 *   import("../../../../lib").Atom
 * >}
 */
const conf = {
  advice_variable: ADVICE_VARIABLE,
  initial_state: null,
  pointcut: false,
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
        ? retro(weaveStandard(trans(path, kind, content), conf))
        : content,
  }),
};

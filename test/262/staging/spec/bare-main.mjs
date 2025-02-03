import { record } from "../../record/index.mjs";
import { toTestSpecifier } from "../../result.mjs";
import { loadTaggingList } from "../../tagging/tagging.mjs";
import { compileAran } from "../aran.mjs";
import { listStageFailure } from "../failure.mjs";

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

const listNegative = await loadTaggingList([
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
]);

/**
 * @type {import("../stage-name").StageName}
 */
const precursor = "parsing";

const precursor_exclusion = await listStageFailure(precursor);

const listExclusionReason = await loadTaggingList([
  "function-string-representation",
]);

/**
 * @type {import("../stage").Stage<null>}
 */
export default {
  // eslint-disable-next-line require-await
  setup: async (test) => {
    const specifier = toTestSpecifier(test.path, test.directive);
    const reasons = [
      ...(precursor_exclusion.has(specifier) ? [precursor] : []),
      ...listExclusionReason(specifier),
    ];
    if (reasons.length > 0) {
      return {
        type: "exclude",
        reasons,
      };
    } else {
      return {
        type: "include",
        state: null,
        flaky: false,
        negatives: listNegative(specifier),
      };
    }
  },
  prepare: (_state, context) => {
    setup(context);
  },
  instrument: ({ type, kind, path, content }) =>
    record({
      path,
      content: type === "main" ? retro(trans(path, kind, content)) : content,
    }),
  teardown: async (_state) => {},
};

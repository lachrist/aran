import { record } from "../../record/index.mjs";
import { toTestSpecifier } from "../../result.mjs";
import { loadTaggingList } from "../../tagging/tagging.mjs";
import { generate, parseGlobal } from "../estree.mjs";
import { compileListPrecursorFailure } from "../failure.mjs";

const listPrecursorFailure = await compileListPrecursorFailure(["identity"]);

const listNegative = await loadTaggingList([
  "parsing-function-string-representation",
  "parsing-cover-parenthesis",
  "parsing-import-assertion",
  "parsing-unknown",
]);

/**
 * @type {import("../stage").Stage<
 *   import("../stage").Config,
 *   null,
 * >}
 */
export default {
  // eslint-disable-next-line require-await
  open: async (config) => config,
  close: async (_config) => {},
  // eslint-disable-next-line require-await
  setup: async (_config, [index, test]) => {
    const specifier = toTestSpecifier(test.path, test.directive);
    const reasons = listPrecursorFailure(index);
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
  prepare: (_state, _context) => {},
  instrument: ({ record_directory }, { type, path, content, kind }) =>
    record(
      {
        path,
        content:
          type === "main" ? generate(parseGlobal(kind, content)) : content,
      },
      record_directory,
    ),
  teardown: async (_state) => {},
};

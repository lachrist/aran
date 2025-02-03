import { record } from "../../record/index.mjs";
import { toTestSpecifier } from "../../result.mjs";
import { loadTaggingList } from "../../tagging/tagging.mjs";
import { generate, parseGlobal } from "../estree.mjs";
import { listStageFailure } from "../failure.mjs";

/**
 * @type {import("../stage-name").StageName}
 */
const precursor = "identity";

const exclusion = await listStageFailure(precursor);

const listNegative = await loadTaggingList([
  "parsing-function-string-representation",
  "parsing-cover-parenthesis",
  "parsing-import-assertion",
  "parsing-unknown",
]);

/** @type {import("../stage").Stage<null>} */
export default {
  // eslint-disable-next-line require-await
  setup: async (test) => {
    const specifier = toTestSpecifier(test.path, test.directive);
    if (exclusion.has(specifier)) {
      return {
        type: "exclude",
        reasons: [precursor],
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
  instrument: ({ path, content, kind }) =>
    record({
      path,
      content: generate(parseGlobal(kind, content)),
    }),
  teardown: async (_state) => {},
};

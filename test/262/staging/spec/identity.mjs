import { record } from "../../record/index.mjs";
import { toTestSpecifier } from "../../result.mjs";
import { loadTaggingList } from "../../tagging/tagging.mjs";

const { Set } = globalThis;

const features = new Set([
  "IsHTMLDDA",
  "legacy-regexp",
  "regexp-duplicate-named-groups",
  "resizable-arraybuffer",
  "Float16Array",
  "FinalizationRegistry.prototype.cleanupSome",
  "promise-try",
  "regexp-modifiers",
  "ShadowRealm",
  "Temporal",
  "Intl.DurationFormat",
  "Intl.Locale-info",
  "tail-call-optimization",
  "decorators",
  "import-assertions",
  "import-attributes",
  "explicit-resource-management",
  "Atomics.pause",
  "Math.sumPrecise",
  "RegExp.escape",
  "uint8array-base64",
  "source-phase-imports",
  // regression from node 22.3 to node 22.13
  "regexp-unicode-property-escapes",
]);

/**
 * @type {(
 *   feature: string,
 * ) => boolean}
 */
const isFeatureFlaky = (feature) => features.has(feature);

const listExclusionReason = await loadTaggingList([
  "call-async-done-with-module",
  "invalid-metadata-header",
]);

const listNegative = await loadTaggingList([
  "negative-identity-annex-b",
  "negative-identity-async-iterator-bypass-finally",
  "negative-identity-atomic-wait-work",
  "negative-identity-compound-assignment",
  "negative-identity-date-coercion-order",
  "negative-identity-eval-arguments-declaration",
  "negative-identity-flaky-symbol-match",
  "negative-identity-flaky-symbol-replace",
  "negative-identity-html-comment",
  "negative-identity-intl402",
  "negative-identity-non-enumerable-global-function",
  "negative-identity-prevent-extension-vm-context",
  "negative-identity-unknown",
  "negative-identity-update-inside-with",
  "negative-identity-wrong-realm-for-dynamic-import",
]);

/**
 * @type {import("../stage.d.ts").Stage<
 *   import("../stage.d.ts").Config,
 *   null,
 * >}
 */
export default {
  // eslint-disable-next-line require-await
  open: async (config) => config,
  close: async (_config) => {},
  // eslint-disable-next-line require-await
  setup: async (_config, [_index, test]) => {
    const specifier = toTestSpecifier(test.path, test.directive);
    const reasons = listExclusionReason(specifier);
    if (reasons.length > 0) {
      return {
        type: "exclude",
        reasons,
      };
    }
    const features = test.features.filter(isFeatureFlaky);
    return {
      type: "include",
      state: null,
      flaky: features.length > 0,
      negatives:
        features.length > 0
          ? /** @type {import("../../tagging/tag.d.ts").Tag[]} */ (features)
          : listNegative(specifier),
    };
  },
  prepare: (_state, _context) => {},
  instrument: ({ record_directory }, source) =>
    record(source, record_directory),
  teardown: async (_state) => {},
};

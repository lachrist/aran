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
]);

/** @type {(feature: string) => boolean} */
const isFeatureExcluded = (feature) => features.has(feature);

/** @type {import("../stage").Stage} */
export default {
  precursor: [],
  exclude: ["call-async-done-with-module", "invalid-metadata-header"],
  negative: [
    "negative-identity-annex-b",
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
  ],
  listLateNegative: (_target, metadata, error) => [
    ...(error.layer === "meta" && error.name === "AranRealmError"
      ? [error.message]
      : []),
    ...metadata.features.filter(isFeatureExcluded),
  ],
  compileInstrument: ({ record }) => record,
};

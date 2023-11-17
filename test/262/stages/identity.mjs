const { Set } = globalThis;

const features = new Set([
  "IsHTMLDDA",
  "Temporal",
  "Atomics",
  "tail-call-optimization",
  "Array.fromAsync",
  "iterator-helpers",
  "array-grouping",
  "Intl.DurationFormat",
  "ShadowRealm",
  "decorators",
  "Intl.Locale-info",
  "resizable-arraybuffer",
  "arraybuffer-transfer",
]);

/** @type {(feature: string) => boolean} */
const isFeatureExcluded = (feature) => features.has(feature);

/** @type {test262.Stage} */
export default {
  requirement: [],
  exclusion: [],
  tagFailure: ({ metadata, error }) => [
    ...(error.name === "AranRealmLimitation" ? ["aran-realm-limitation"] : []),
    ...metadata.features.filter(isFeatureExcluded),
  ],
  createInstrumenter: (_options) => ({
    setup: "",
    globals: {},
    instrument: (source) => source,
  }),
};

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

/** @type {(log: test262.Log) => boolean} */
const isRealmLimitation = ({ name }) => name === "RealmLimitation";

/** @type {test262.Stage} */
export default {
  tagResult: (result) => [
    ...result.features.filter(isFeatureExcluded),
    ...(result.trace.some(isRealmLimitation) ? ["RealmLimitation"] : []),
  ],
  makeInstrumenter: (_errors) => ({
    setup: "",
    globals: [],
    instrument: (code, _options) => code,
  }),
};

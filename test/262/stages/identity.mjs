const { Set } = globalThis;

const exclusion = new Set([
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
const isFeatureExcluded = (feature) => exclusion.has(feature);

/** @type {(failure: test262.Result) => boolean} */
const isFailureNotExcluded = ({ features }) =>
  !features.some(isFeatureExcluded);

/** @type {(error: test262.Error) => boolean} */
const isRealmError = ({ type }) => type === "realm";

/** @type {(failure: test262.Result) => boolean} */
const isNotRealmFailure = ({ errors }) => !errors.some(isRealmError);

/** @type {test262.Stage} */
export default {
  requirements: [],
  filtering: [
    ["Not related to realm", isNotRealmFailure],
    ["Not excluded by feature", isFailureNotExcluded],
  ],
  makeInstrumenter: (_errors) => ({
    setup: "",
    globals: [],
    instrument: (code, _options) => code,
  }),
};

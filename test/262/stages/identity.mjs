import { readFile } from "node:fs/promises";
import { compileExpect } from "./util/index.mjs";

const { JSON, URL, Set } = globalThis;

const features = new Set([
  "legacy-regexp",
  "regexp-duplicate-named-groups",
  "promise-with-resolvers",
  "Symbol.match",
  "Symbol.replace",
  "FinalizationRegistry.prototype.cleanupSome",
  "import-assertions",
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
  "regexp-unicode-property-escapes",
]);

/** @type {(feature: string) => boolean} */
const isFeatureExcluded = (feature) => features.has(feature);

const expect = compileExpect(
  JSON.parse(
    await readFile(new URL("identity.manual.json", import.meta.url), "utf8"),
  ),
);

/** @type {[]} */
const EMPTY = [];

const ARAN_REALM_LIMITATION = ["aran-realm-limitation"];

/** @type {test262.Stage} */
export default {
  requirement: [],
  exclusion: [],
  expect: (result) => [
    ...(result.error !== null && result.error.name === "RealmAranError"
      ? ARAN_REALM_LIMITATION
      : EMPTY),
    ...(result.error === null
      ? EMPTY
      : result.metadata.features.filter(isFeatureExcluded)),
    ...expect(result),
  ],
  compileInstrument: ({ record }) => record,
};

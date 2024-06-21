import { readFile } from "node:fs/promises";
import {
  getNegativeStatus,
  listNegativeCause,
  parseNegative,
} from "../negative.mjs";

const { URL, Set } = globalThis;

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

const negative = parseNegative(
  await readFile(new URL("identity.negative.txt", import.meta.url), "utf8"),
);

/** @type {[]} */
const EMPTY = [];

const ARAN_REALM_LIMITATION = ["aran-realm-limitation"];

/** @type {import("../types").Stage} */
export default {
  isExcluded: (_target) => false,
  predictStatus: (target) => getNegativeStatus(negative, target),
  listCause: (result) => [
    ...(result.error.name === "RealmAranError" ? ARAN_REALM_LIMITATION : EMPTY),
    ...result.metadata.features.filter(isFeatureExcluded),
    ...listNegativeCause(negative, result.target),
  ],
  compileInstrument: ({ record }) => record,
};

import { createWriteStream } from "node:fs";
import { batch } from "../batch.mjs";
import { report } from "../report.mjs";
import { readFile } from "node:fs/promises";

const { URL, Set, Promise } = globalThis;

const test262 = new URL("../../../test262/", import.meta.url);

const url = new URL("failures.txt", import.meta.url);

const writable = createWriteStream(url);

await batch({
  test262,
  isExcluded: (_relative) => false,
  writable,
  instrument: (code, _kind) => code,
});

await new Promise((resolve) => {
  writable.end(resolve);
});

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

/** @type {(failure: import("../types").Failure) => boolean} */
const isFailureNotExcluded = ({ features }) =>
  !features.some(isFeatureExcluded);

/** @type {(error: import("../types").TestError) => boolean} */
const isRealmError = ({ type }) => type === "realm";

/** @type {(failure: import("../types").Failure) => boolean} */
const isNotRealmFailure = ({ errors }) => !errors.some(isRealmError);

// eslint-disable-next-line no-console
console.log(
  report(await readFile(url, "utf8"), [
    ["realm", isNotRealmFailure],
    ["feature", isFailureNotExcluded],
  ]),
);

import { createWriteStream } from "node:fs";
import { batch } from "../batch.mjs";
import { report } from "../report.mjs";

const { URL, Set } = globalThis;

const test262 = new URL("../../../test262/", import.meta.url);

const url = new URL("failures.txt", import.meta.url);

await batch({
  test262,
  isExcluded: (_relative) => false,
  writable: createWriteStream(url),
  instrument: (code, _kind) => code,
});

await report({
  url,
  test262,
  exclusion: new Set([
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
  ]),
});

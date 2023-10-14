import { createWriteStream } from "node:fs";
import { batch } from "../batch.mjs";
import { report } from "../report.mjs";
import { readFile } from "node:fs/promises";
import { parse } from "acorn";
import { generate } from "astring";

const { JSON, URL, Set, Promise } = globalThis;

const test262 = new URL("../../../test262/", import.meta.url);

const url = new URL("failures.txt", import.meta.url);

const writable = createWriteStream(url);

await batch({
  test262,
  isExcluded: (_relative) => false,
  writable,
  instrument: (code, kind) =>
    generate(parse(code, { ecmaVersion: "latest", sourceType: kind })),
});

await new Promise((resolve) => {
  writable.end(resolve);
});

/** @type {(line: string) => string} */
const parseFailure = (line) => JSON.parse(line)[0];

/** @type {(line: string) => boolean} */
const isNotEmpty = (line) => line !== "";

const exclusion = new Set(
  (await readFile(new URL("../identity/failures.txt", import.meta.url), "utf8"))
    .split("\n")
    .filter(isNotEmpty)
    .map(parseFailure),
);

/** @type {(failure: import("../types").Failure) => boolean} */
const isFailureNotExcluded = ({ relative }) => !exclusion.has(relative);

// eslint-disable-next-line no-console
console.log(
  report(await readFile(url, "utf8"), [["identity", isFailureNotExcluded]]),
);

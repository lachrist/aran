import { readFile } from "node:fs/promises";
import { matchSelection, parseSelection } from "./selection.mjs";
import { createInterface } from "node:readline";
import { createReadStream } from "node:fs";
import { isResult } from "./result.mjs";
import { AranExecError, AranTypeError } from "./error.mjs";

const { JSON, Set, URL, Infinity } = globalThis;

/**
 * @template X
 * @param {import("./stage").Recording<X>} recording
 * @param {import("./fetch").MainPath} path
 * @returns {X[]}
 */
export const listRecordingValue = (recording, path) => {
  /** @type {X[]} */
  const values = [];
  for (const [selection, value] of recording) {
    if (matchSelection(selection, path)) {
      values.push(value);
    }
  }
  return values;
};

/**
 * @type {(
 *   tag: import("./tag").Tag,
 * ) => Promise<
 *   import("./stage").RecordingEntry<
 *     import("./tag").Tag
 *   >
 * >}
 */
const loadRecordingEntry = async (tag) => [
  parseSelection(
    await readFile(new URL(`./tagging/${tag}.txt`, import.meta.url), "utf8"),
  ),
  tag,
];

/**
 * @type {(
 *   name: import("./stage").StageName,
 * ) => Promise<
 *   import("./stage").RecordingEntry<
 *     import("./stage").StageName
 *   >
 * >}
 */
const loadPrecursorExclusion = async (stage) => {
  const paths = new Set();
  for await (const line of createInterface({
    input: createReadStream(
      new URL(`./stages/${stage}.jsonl`, import.meta.url),
    ),
    crlfDelay: Infinity,
  })) {
    const result = JSON.parse(line);
    if (isResult(result)) {
      if (result.type === "exclude") {
        paths.add(result.path);
      } else if (result.type === "include") {
        if (result.actual !== null || result.expect !== null) {
          paths.add(result.path);
        }
      } else {
        throw new AranTypeError(result.type);
      }
    } else {
      throw new AranExecError("invalid result", result);
    }
  }
  return [{ exact: paths, group: [] }, stage];
};

const {
  Object: { hasOwn },
} = globalThis;

/**
 * @type {{ [key in import("./stage").StageName]: null }}
 */
export const STAGE_ENUM = {
  "identity": null,
  "parsing": null,
  "bare-basic-standard": null,
  "bare-basic-flexible": null,
  "bare-patch-flexible": null,
  "bare-patch-standard": null,
  "bare-weave-flexible": null,
  "bare-weave-standard": null,
  "full-basic-standard": null,
  "full-basic-flexible": null,
  "state-basic-standard": null,
};

/**
 * @type {(
 *   value: string,
 * ) => value is import("./stage").StageName}
 */
export const isStageName = (value) => hasOwn(STAGE_ENUM, value);

/**
 * @type {(
 *   name: import("./stage").StageName,
 * ) => Promise<import("./stage").ReadyStage>}
 */
export const loadStage = async (name) => {
  const stage = /** @type {{default: import("./stage").Stage}} */ (
    await import(`./stages/${name}.mjs`)
  ).default;
  /** @type {import("./stage").Exclusion} */
  const exclusion = [];
  for (const precursor of stage.precursor) {
    exclusion.push(await loadPrecursorExclusion(precursor));
  }
  for (const tag of stage.exclude) {
    exclusion.push(await loadRecordingEntry(tag));
  }
  /** @type {import("./stage").Negation} */
  const negation = [];
  for (const tag of stage.negative) {
    negation.push(await loadRecordingEntry(tag));
  }
  return {
    setup: stage.setup,
    instrument: stage.instrument,
    listLateNegative: stage.listLateNegative,
    listExclusionReason: (path) => listRecordingValue(exclusion, path),
    listNegative: (path) => listRecordingValue(negation, path),
  };
};

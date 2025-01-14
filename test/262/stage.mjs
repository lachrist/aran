import { readdir, readFile } from "node:fs/promises";
import { matchSelection, parseSelection } from "./selection.mjs";
import { createInterface } from "node:readline";
import { createReadStream } from "node:fs";
import { isCompactResult, unpackResultEntry } from "./result.mjs";
import { AranExecError, AranTypeError } from "./error.mjs";
import {
  compileFetchHarness,
  compileFetchTarget,
  resolveDependency,
} from "./fetch.mjs";
import { home } from "./home.mjs";
import { execTest } from "./test.mjs";
import { record } from "./record.mjs";

const {
  JSON,
  Set,
  URL,
  Infinity,
  Object: { hasOwn },
  Map,
} = globalThis;

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
 *   object: { actual: unknown },
 * ) => boolean}
 */
const isActualNull = ({ actual }) => actual === null;

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
    const compact_result = JSON.parse(line);
    if (isCompactResult(compact_result)) {
      const [key, val] = unpackResultEntry(compact_result);
      if (val.type === "exclude") {
        paths.add(key);
      } else if (val.type === "include") {
        if (val.data.some(isActualNull)) {
          paths.add(key);
        }
      } else {
        throw new AranTypeError(val);
      }
    } else {
      throw new AranExecError("invalid compact result", compact_result);
    }
  }
  return [{ exact: paths, group: [] }, stage];
};

/**
 * @type {{ [key in import("./stage").StageName]: null }}
 */
export const STAGE_ENUM = {
  "identity": null,
  "parsing": null,
  "bare-min": null,
  "bare-basic-standard": null,
  "bare-basic-flexible": null,
  "bare-patch-flexible": null,
  "bare-patch-standard": null,
  "bare-weave-flexible": null,
  "bare-weave-standard": null,
  "full-basic-standard": null,
  "full-basic-flexible": null,
  "track-origin": null,
};

/**
 * @type {(
 *   value: string,
 * ) => value is import("./stage").StageName}
 */
export const isStageName = (value) => hasOwn(STAGE_ENUM, value);

/**
 * @type {(
 *   precursors: import("./stage").StageName[],
 *   exclude: import("./tag").Tag[],
 * ) => Promise<(
 *   path: import("./fetch").MainPath,
 * ) => (import("./tag").Tag | import("./stage").StageName)[]>}
 */
const compileListExclusionReason = async (precursors, exclude) => {
  /** @type {import("./stage").Exclusion} */
  const exclusion = [];
  for (const precursor of precursors) {
    exclusion.push(await loadPrecursorExclusion(precursor));
  }
  for (const tag of exclude) {
    exclusion.push(await loadRecordingEntry(tag));
  }
  return (path) => listRecordingValue(exclusion, path);
};

/**
 * @type {(
 *   negatives: import("./tag").Tag[],
 * ) => Promise<(
 *   path: import("./fetch").MainPath,
 * ) => import("./tag").Tag[]>}
 */
const compileListNegative = async (negatives) => {
  /** @type {import("./stage").Negation} */
  const negation = [];
  for (const tag of negatives) {
    negation.push(await loadRecordingEntry(tag));
  }
  return (path) => listRecordingValue(negation, path);
};

/**
 * @type {(
 *   name: import("./stage").StageName,
 * ) => Promise<import("./stage").ReadyStage>}
 */
const loadStage = async (name) => {
  const stage = /** @type {{default: import("./stage").Stage}} */ (
    await import(`./stages/${name}.mjs`)
  ).default;
  const { setup, instrument, listLateNegative, precursor, negative, exclude } =
    stage;
  return {
    setup,
    instrument,
    listLateNegative,
    listExclusionReason: await compileListExclusionReason(precursor, exclude),
    listNegative: await compileListNegative(negative),
  };
};

/**
 * @type {(
 *   stage: import("./stage").ReadyStage,
 * ) => (path: import("./fetch").MainPath) => Promise<import("./result").Result>}
 */
/**
 * @type {(
 *   path: import("./fetch").MainPath,
 *   stage: import("./stage").ReadyStage,
 *   fetch: import("./fetch").Fetch,
 * ) => Promise<import("./result").Result>}
 */
const execStage = async (
  path,
  { listLateNegative, instrument, setup, listExclusionReason, listNegative },
  { resolveDependency, fetchHarness, fetchTarget },
) => {
  const exclusion_tag_array = listExclusionReason(path);
  if (exclusion_tag_array.length === 0) {
    const { metadata, result } = await execTest(path, {
      setup,
      instrument,
      fetchTarget,
      fetchHarness,
      resolveDependency,
    });
    if (result.type === "exclude") {
      return result;
    } else if (result.type === "include") {
      return {
        type: "include",
        data: result.data.map((execution) => ({
          ...execution,
          expect: [
            ...execution.expect,
            ...listNegative(path),
            ...(execution.actual === null
              ? []
              : listLateNegative(path, metadata, execution.actual)),
          ],
        })),
      };
    } else {
      throw new AranTypeError(result);
    }
  } else {
    return { type: "exclude", data: exclusion_tag_array };
  }
};

/**
 * @type {(
 *   instrument: import("./stage").Instrument,
 * ) => import("./stage").Instrument}
 */
const memoizeInstrument = (instrument) => {
  /**
   * @type {Map<
   *   import("./fetch").HarnessName,
   *   import("./stage").File
   * >}
   */
  const cache = new Map();
  return (source) => {
    if (source.type === "harness") {
      const outcome = cache.get(source.path);
      if (outcome) {
        return outcome;
      } else {
        const outcome = instrument(source);
        cache.set(source.path, outcome);
        return outcome;
      }
    } else {
      return instrument(source);
    }
  };
};

/**
 * @type {(
 *   name: import("./stage").StageName,
 *   options: {
 *     memoization: "none" | "lazy" | "eager",
 *     recording: boolean,
 *   },
 * ) => Promise<(
 *   path: import("./fetch").MainPath,
 * ) => Promise<import("./result").Result>>}
 */
export const compileStage = async (name, { memoization, recording }) => {
  const fetch = {
    resolveDependency,
    fetchHarness: compileFetchHarness(home),
    fetchTarget: compileFetchTarget(home),
  };
  const stage = await loadStage(name);
  if (memoization !== "none") {
    stage.instrument = memoizeInstrument(stage.instrument);
    if (memoization === "eager") {
      // Fetch all harnesses to cache them and improve timer accuracy
      for (const name of /** @type {import("./fetch").HarnessName[]} */ (
        await readdir(new URL("harness/", home))
      )) {
        if (name.endsWith(".js")) {
          stage.instrument({
            type: "harness",
            kind: "script",
            path: name,
            content: await fetch.fetchHarness(name),
          });
        }
      }
    }
  }
  if (recording) {
    const { instrument } = stage;
    stage.instrument = (source) => record(instrument(source));
  }
  return (path) => execStage(path, stage, fetch);
};

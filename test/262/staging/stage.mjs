import { readdir } from "node:fs/promises";
import { createInterface } from "node:readline";
import { createReadStream } from "node:fs";
import { isNotEmptyArray, getFirst } from "../util/index.mjs";
import {
  isFailureCompactResultEntry,
  parseCompactResultEntry,
  toTestSpecifier,
} from "../result.mjs";
import {
  compileFetchHarness,
  compileFetchTarget,
  resolveDependency,
} from "../fetch.mjs";
import { home } from "../home.mjs";
import { parseTestFile } from "../test-file/index.mjs";
import { execTestCase } from "../test-case/index.mjs";
import { loadTaggingList } from "../tagging/index.mjs";
import { STAGE_ENUM } from "./stage-name.mjs";

const {
  Set,
  URL,
  Infinity,
  Object: { hasOwn },
  Map,
} = globalThis;

/**
 * @type {(
 *   name: import("./stage-name").StageName,
 * ) => Promise<Set<import("../result").TestSpecifier>>}
 */
const loadPrecursorFailure = async (stage) => {
  /** @type {Set<import("../result").TestSpecifier>} */
  const specifiers = new Set();
  for await (const line of createInterface({
    input: createReadStream(
      new URL(`./stages/${stage}.jsonl`, import.meta.url),
    ),
    crlfDelay: Infinity,
  })) {
    const compact_result = parseCompactResultEntry(line);
    if (isFailureCompactResultEntry(compact_result)) {
      specifiers.add(compact_result[0]);
    }
  }
  return specifiers;
};

/**
 * @type {(
 *   value: string,
 * ) => value is import("./stage-name").StageName}
 */
export const isStageName = (value) => hasOwn(STAGE_ENUM, value);

/**
 * @type {(
 *   precursors: import("./stage-name").StageName[],
 *   exclude: import("../tagging/tag").Tag[],
 * ) => Promise<(
 *   specifier: import("../result").TestSpecifier,
 * ) => (import("../tagging/tag").Tag | import("./stage-name").StageName)[]>}
 */
const compileListExclusionReason = async (precursors, exclude) => {
  /**
   * @type {[
   *   import("./stage-name").StageName,
   *   Set<import("../result").TestSpecifier>,
   * ][]}
   */
  const entries = [];
  for (const precursor of precursors) {
    entries.push([precursor, await loadPrecursorFailure(precursor)]);
  }
  const tagging = await loadTaggingList(exclude);
  return (specifier) => [
    ...entries
      .filter(([_precursor, specifiers]) => specifiers.has(specifier))
      .map(getFirst),
    ...tagging(specifier),
  ];
};

/**
 * @type {(
 *   name: import("./stage-name").StageName,
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
    listNegative: await loadTaggingList(negative),
  };
};

/**
 * @type {(
 *   path: import("../fetch").TestPath,
 *   stage: import("./stage").ReadyStage,
 *   fetch: import("../fetch").Fetch,
 * ) => Promise<import("../result").ResultEntry[]>}
 */
const execStage = async (
  path,
  { listLateNegative, instrument, setup, listExclusionReason, listNegative },
  { resolveDependency, fetchHarness, fetchTarget },
) => {
  const test_case_array = parseTestFile({
    path,
    content: await fetchTarget(path),
  });
  /** @type {import("../result").ResultEntry[]} */
  const entries = [];
  for (const test_case of test_case_array) {
    const specifier = toTestSpecifier(
      test_case.source.path,
      test_case.directive,
    );
    const exclusion = listExclusionReason(specifier);
    if (isNotEmptyArray(exclusion)) {
      entries.push([specifier, exclusion]);
    } else {
      const { actual, expect, time } = await execTestCase(test_case, {
        resolveDependency,
        fetchHarness,
        fetchTarget,
        setup,
        instrument,
      });
      entries.push([
        toTestSpecifier(test_case.source.path, test_case.directive),
        {
          actual,
          expect: [
            ...expect,
            ...listNegative(specifier),
            ...(actual === null
              ? []
              : listLateNegative(specifier, test_case.metadata, actual)),
          ],
          time,
        },
      ]);
    }
  }
  return entries;
};

/**
 * @type {(
 *   instrument: import("./stage").Instrument,
 * ) => import("./stage").Instrument}
 */
const memoizeInstrument = (instrument) => {
  /**
   * @type {Map<
   *   import("../fetch").HarnessName,
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
 *   name: import("./stage-name").StageName,
 *   options: {
 *     memoization: "none" | "lazy" | "eager",
 *     record: null | ((
 *       file: import("./stage").File,
 *     ) => import("./stage").File),
 *   },
 * ) => Promise<(
 *   path: import("../fetch").TestPath,
 * ) => Promise<import("../result").ResultEntry[]>>}
 */
export const compileStage = async (name, { memoization, record }) => {
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
      for (const name of /** @type {import("../fetch").HarnessName[]} */ (
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
  if (record) {
    const { instrument } = stage;
    stage.instrument = (source) => record(instrument(source));
  }
  return (path) => execStage(path, stage, fetch);
};

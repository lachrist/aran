import { readdir } from "node:fs/promises";
import { isNotEmptyArray, getFirst } from "../util/index.mjs";
import { toTestSpecifier } from "../result.mjs";
import {
  compileFetchHarness,
  compileFetchTarget,
  resolveDependency,
} from "../fetch.mjs";
import { HARNESS, TEST262 } from "../layout.mjs";
import { execTestCase } from "../test-case/index.mjs";
import { loadTaggingList } from "../tagging/index.mjs";
import { STAGE_ENUM } from "./stage-name.mjs";
import { loadStageFailure } from "./failure.mjs";

const {
  Set,
  Object: { hasOwn },
  Map,
} = globalThis;

/**
 * @type {(
 *   name: import("./stage-name").StageName,
 * ) => Promise<Set<import("../result").TestSpecifier>>}
 */
const loadPrecursorFailure = async (stage) => {
  const failures = new Set();
  for await (const precursor of loadStageFailure(stage)) {
    failures.add(precursor);
  }
  return failures;
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
    await import(`./spec/${name}.mjs`)
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
 *   test: import("../test-case").TestCase,
 *   stage: import("./stage").ReadyStage,
 *   fetch: import("../fetch").Fetch,
 * ) => Promise<import("../result").Result>}
 */
const execStage = async (
  test,
  { listLateNegative, instrument, setup, listExclusionReason, listNegative },
  { resolveDependency, fetchHarness, fetchTarget },
) => {
  const specifier = toTestSpecifier(test.path, test.directive);
  const exclusion = listExclusionReason(specifier);
  if (isNotEmptyArray(exclusion)) {
    return exclusion;
  } else {
    const { actual, expect, time } = await execTestCase(test, {
      resolveDependency,
      fetchHarness,
      fetchTarget,
      setup,
      instrument,
    });
    return {
      actual,
      expect: [
        ...expect,
        ...listNegative(specifier),
        ...(actual === null ? [] : listLateNegative(test, actual)),
      ],
      time,
    };
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
   *   import("../fetch").HarnessName,
   *   import("../util/file").File
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
 *   },
 * ) => Promise<(
 *   test: import("../test-case").TestCase,
 * ) => Promise<import("../result").Result>>}
 */
export const compileStage = async (name, { memoization }) => {
  const fetch = {
    resolveDependency,
    fetchHarness: compileFetchHarness(TEST262),
    fetchTarget: compileFetchTarget(TEST262),
  };
  const stage = await loadStage(name);
  if (memoization !== "none") {
    stage.instrument = memoizeInstrument(stage.instrument);
    if (memoization === "eager") {
      // Fetch all harnesses to cache them and improve timer accuracy
      for (const name of /** @type {import("../fetch").HarnessName[]} */ (
        await readdir(HARNESS)
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
  return (test) => execStage(test, stage, fetch);
};

import { readdir, readFile } from "node:fs/promises";
import { listRecordingValue, parseSelection } from "./selection.mjs";
import { createInterface } from "node:readline";
import { createReadStream } from "node:fs";
import {
  isFailureCompactResultEntry,
  parseCompactResultEntry,
  toTestSpecifier,
} from "./result.mjs";
import {
  compileFetchHarness,
  compileFetchTarget,
  resolveDependency,
} from "./fetch.mjs";
import { home } from "./home.mjs";
import { parseTest } from "./test.mjs";
import { record } from "./record.mjs";
import { execTestCase } from "./test-case.mjs";
import { isNotEmptyArray } from "./util.mjs";

const {
  Set,
  URL,
  Infinity,
  Object: { hasOwn },
  Map,
} = globalThis;

/**
 * @type {(
 *   line: string
 * ) => import("./result").TestSpecifier[]}
 */
const listTestSpecifier = (line) =>
  line.includes("@")
    ? [/** @type {import("./result").TestSpecifier} */ (line)]
    : [
        toTestSpecifier(
          /** @type {import("./fetch").TestPath} */ (line),
          "none",
        ),
        toTestSpecifier(
          /** @type {import("./fetch").TestPath} */ (line),
          "use-strict",
        ),
      ];

/**
 * @type {(
 *   tag: import("./tag").Tag,
 * ) => Promise<
 *   import("./selection").SelectionEntry<
 *     import("./result").TestSpecifier,
 *     import("./tag").Tag
 *   >
 * >}
 */
const loadRecordingEntry = async (tag) => [
  parseSelection(
    await readFile(new URL(`./tagging/${tag}.txt`, import.meta.url), "utf8"),
    listTestSpecifier,
  ),
  tag,
];

/**
 * @type {(
 *   name: import("./stage").StageName,
 * ) => Promise<
 *   import("./selection").SelectionEntry<
 *     import("./result").TestSpecifier,
 *     import("./stage").StageName
 *   >
 * >}
 */
const loadPrecursorExclusion = async (stage) => {
  /** @type {Set<import("./result").TestSpecifier>} */
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
  return [{ exact: specifiers, group: [] }, stage];
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
 *   specifier: import("./result").TestSpecifier,
 * ) => (import("./tag").Tag | import("./stage").StageName)[]>}
 */
const compileListExclusionReason = async (precursors, exclude) => {
  /**
   * @type {import("./selection").SelectionEntry<
   *   import("./result").TestSpecifier,
   *   import("./tag").Tag | import("./stage").StageName
   * >[]}
   */
  const exclusion = [];
  for (const precursor of precursors) {
    exclusion.push(await loadPrecursorExclusion(precursor));
  }
  for (const tag of exclude) {
    exclusion.push(await loadRecordingEntry(tag));
  }
  return (specifier) => listRecordingValue(exclusion, specifier);
};

/**
 * @type {(
 *   negatives: import("./tag").Tag[],
 * ) => Promise<(
 *   specifier: import("./result").TestSpecifier,
 * ) => import("./tag").Tag[]>}
 */
const compileListNegative = async (negatives) => {
  /**
   * @type {import("./selection").SelectionEntry<
   *   import("./result").TestSpecifier,
   *   import("./tag").Tag,
   * >[]}
   */
  const negation = [];
  for (const tag of negatives) {
    negation.push(await loadRecordingEntry(tag));
  }
  return (specifier) => listRecordingValue(negation, specifier);
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
 *   path: import("./fetch").TestPath,
 *   stage: import("./stage").ReadyStage,
 *   fetch: import("./fetch").Fetch,
 * ) => Promise<import("./result").ResultEntry[]>}
 */
const execStage = async (
  path,
  { listLateNegative, instrument, setup, listExclusionReason, listNegative },
  { resolveDependency, fetchHarness, fetchTarget },
) => {
  const test_case_array = parseTest({
    path,
    content: await fetchTarget(path),
  });
  /** @type {import("./result").ResultEntry[]} */
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
 *   path: import("./fetch").TestPath,
 * ) => Promise<import("./result").ResultEntry[]>>}
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

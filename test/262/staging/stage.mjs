import { readdir } from "node:fs/promises";
import {
  compileFetchHarness,
  compileFetchTarget,
  resolveDependency,
} from "../fetch.mjs";
import { HARNESS, TEST262 } from "../layout.mjs";
import { execTestCase } from "../test-case/index.mjs";
import { STAGE_ENUM } from "./stage-name.mjs";
import { AranTypeError } from "../error.mjs";
import { toTestSpecifier } from "../result.mjs";

const {
  Object: { hasOwn },
  Map,
} = globalThis;

/**
 * @type {(
 *   value: string,
 * ) => value is import("./stage-name").StageName}
 */
export const isStageName = (value) => hasOwn(STAGE_ENUM, value);

/**
 * @type {<H, X>(
 *   stage: import("./stage").Stage<H, X>,
 *   handle: H,
 *   test: import("../test-case").TestCase,
 *   fetch: import("../fetch").Fetch,
 * ) => Promise<import("../result").ResultEntry>}
 */
const execStage = async (
  { setup, prepare, instrument, teardown },
  handle,
  test,
  { resolveDependency, fetchHarness, fetchTarget },
) => {
  const specifier = toTestSpecifier(test.path, test.directive);
  const selector = await setup(handle, test);
  switch (selector.type) {
    case "exclude": {
      return [specifier, selector];
    }
    case "include": {
      const { state, flaky, negatives } = selector;
      const { actual, expect, time } = await execTestCase(handle, state, test, {
        resolveDependency,
        fetchHarness,
        fetchTarget,
        prepare,
        instrument,
      });
      await teardown(state);
      return [
        specifier,
        {
          type: "include",
          actual,
          expect: flaky && actual === null ? [] : [...expect, ...negatives],
          time,
        },
      ];
    }
    default: {
      throw new AranTypeError(selector);
    }
  }
};

/**
 * @type {<H>(
 *   instrument: import("./stage").Instrument<H>,
 * ) => import("./stage").Instrument<H>}
 */
const memoizeInstrument = (instrument) => {
  /**
   * @type {Map<
   *   import("../fetch").HarnessName,
   *   import("../util/file").File
   * >}
   */
  const cache = new Map();
  return (handle, source) => {
    if (source.type === "harness") {
      const outcome = cache.get(source.path);
      if (outcome) {
        return outcome;
      } else {
        const outcome = instrument(handle, source);
        cache.set(source.path, outcome);
        return outcome;
      }
    } else {
      return instrument(handle, source);
    }
  };
};

/**
 * @type {(
 *   name: import("./stage-name").StageName,
 *   tests: AsyncIterable<import("../test-case").TestCase>,
 *   config: {
 *     memoization: "none" | "lazy" | "eager",
 *     record_directory: null | URL,
 *   },
 * ) => AsyncGenerator<import("../result").ResultEntry>}
 */
export const runStage = async function* (
  name,
  tests,
  { memoization, record_directory },
) {
  const fetch = {
    resolveDependency,
    fetchHarness: compileFetchHarness(TEST262),
    fetchTarget: compileFetchTarget(TEST262),
  };
  /**
   * @type {import("./stage").Stage<
   *   { __brand: "Handle" },
   *   { __brand: "State" },
   * >}
   */
  const stage = (await import(`./spec/${name}.mjs`)).default;
  const handle = await stage.open({ record_directory });
  try {
    if (memoization !== "none") {
      stage.instrument = memoizeInstrument(stage.instrument);
      if (memoization === "eager") {
        // Fetch all harnesses to cache them and improve timer accuracy
        for (const name of /** @type {import("../fetch").HarnessName[]} */ (
          await readdir(HARNESS)
        )) {
          if (name.endsWith(".js")) {
            stage.instrument(handle, {
              type: "harness",
              kind: "script",
              path: name,
              content: await fetch.fetchHarness(name),
            });
          }
        }
      }
    }
    for await (const test of tests) {
      yield execStage(stage, handle, test, fetch);
    }
  } finally {
    await stage.close(handle);
  }
};

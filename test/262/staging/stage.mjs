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
 * @type {<X>(
 *   test: import("../test-case").TestCase,
 *   stage: import("./stage").Stage<X>,
 *   fetch: import("../fetch").Fetch,
 * ) => Promise<import("../result").Result>}
 */
const execStage = async (
  test,
  { setup, prepare, instrument, teardown },
  { resolveDependency, fetchHarness, fetchTarget },
) => {
  const selector = await setup(test);
  switch (selector.type) {
    case "exclude": {
      return selector;
    }
    case "include": {
      const { state, flaky, negatives } = selector;
      const { actual, expect, time } = await execTestCase(state, test, {
        resolveDependency,
        fetchHarness,
        fetchTarget,
        prepare,
        instrument,
      });
      await teardown(state);
      return {
        type: "include",
        actual,
        expect: flaky && actual === null ? [] : [...expect, ...negatives],
        time,
      };
    }
    default: {
      throw new AranTypeError(selector);
    }
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
 * @template X
 * @param {import("./stage-name").StageName} name
 * @param {{
 *   memoization: "none" | "lazy" | "eager",
 * }} options
 * @returns {Promise<(
 *    test: import("../test-case").TestCase,
 * ) => Promise<import("../result").Result>>}
 */
export const compileStage = async (name, { memoization }) => {
  const fetch = {
    resolveDependency,
    fetchHarness: compileFetchHarness(TEST262),
    fetchTarget: compileFetchTarget(TEST262),
  };
  /** @type {import("./stage").Stage<unknown>} */
  const stage = (await import(`./spec/${name}.mjs`)).default;
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

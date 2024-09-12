/* eslint-disable local/strict-console */

import { open, readdir } from "node:fs/promises";
import { scrape } from "./scrape.mjs";
import { argv, cpuUsage } from "node:process";
import { runTest } from "./test.mjs";
import { home } from "./home.mjs";
import { inspectErrorMessage, inspectErrorName } from "./error-serial.mjs";
import { listTag } from "./tagging.mjs";
import { listPrecursor } from "./precursor.mjs";
import { isStageName, loadStage } from "./stage.mjs";
import {
  compileFetchHarness,
  compileFetchTarget,
  resolveDependency,
  toMainPath,
} from "./fetch.mjs";

const { Error, console, process, URL, JSON, Map, undefined } = globalThis;

/**
 * @type {(
 *   path: import("./fetch").MainPath,
 *   stage: import("./stage").ReadyStage,
 *   fetch: import("./fetch").Fetch,
 * ) => Promise<import("./result").Result>}
 */
const test = async (
  path,
  { listLateNegative, instrument, setup, precursor, exclude, negative },
  { resolveDependency, fetchHarness, fetchTarget },
) => {
  const reasons = [
    ...listPrecursor(precursor, path),
    ...listTag(exclude, path),
  ];
  if (reasons.length === 0) {
    const timer = cpuUsage();
    const { metadata, outcome } = await runTest(path, {
      setup,
      instrument,
      fetchTarget,
      fetchHarness,
      resolveDependency,
    });
    return {
      type: "include",
      path,
      time: cpuUsage(timer),
      expect: [
        ...listTag(negative, path),
        ...(outcome.type === "failure"
          ? listLateNegative(path, metadata, outcome.data)
          : []),
      ],
      actual: outcome.type === "failure" ? outcome.data : null,
    };
  } else {
    return {
      type: "exclude",
      path,
      reasons,
    };
  }
};

/**
 * @type {(
 *   instrument: import("./stage").Instrument,
 * ) => import("./stage").Instrument}
 */
const wrapInstrument = (instrument) => {
  /**
   * @type {Map<
   *   import("./fetch").HarnessName,
   *   import("./stage").InstrumentOutcome
   * >}
   */
  const cache = new Map();
  return (source) => {
    if (source.type === "harness") {
      const outcome = cache.get(source.path);
      if (outcome !== undefined) {
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
 *   argv: string[],
 * ) => Promise<void>}
 */
const main = async (argv) => {
  if (argv.length < 3) {
    throw new Error(
      "usage: node --experimental-vm-modules --expose-gc test/262/exec.mjs <stage>",
    );
  }
  const [_node, _main, stage_name] = argv;
  if (!isStageName(stage_name)) {
    throw new Error(`invalid stage: ${stage_name}`);
  }
  const stage = await loadStage(stage_name);
  stage.instrument = wrapInstrument(stage.instrument);
  let sigint = false;
  const onSigint = () => {
    sigint = true;
  };
  process.addListener("SIGINT", onSigint);
  const onUncaughtException = (/** @type {unknown} */ error) => {
    console.log(`${inspectErrorName(error)}: ${inspectErrorMessage(error)}`);
  };
  process.addListener("uncaughtException", onUncaughtException);
  let index = 0;
  const handle = await open(
    new URL(`stages/${stage_name}.jsonl`, import.meta.url),
    "w",
  );
  const stream = handle.createWriteStream({
    encoding: "utf8",
  });
  const fetch = {
    resolveDependency,
    fetchHarness: compileFetchHarness(home),
    fetchTarget: compileFetchTarget(home),
  };
  // Fetch all harnesses to cache them and improve timer accuracy
  for (const name of /** @type {import("./fetch").HarnessName[]} */ (
    await readdir(new URL("harness/", home))
  )) {
    stage.instrument({
      type: "harness",
      kind: "script",
      path: name,
      content: await fetch.fetchHarness(name),
      context: null,
    });
  }
  for await (const url of scrape(new URL("test/", home))) {
    if (sigint) {
      // eslint-disable-next-line local/no-label
      break;
    }
    if (index % 100 === 0) {
      console.dir(index);
    }
    const path = toMainPath(url, home);
    if (path !== null) {
      stream.write(JSON.stringify(await test(path, stage, fetch)) + "\n");
      index += 1;
    }
  }
  process.removeListener("SIGINT", onSigint);
  process.removeListener("uncaughtException", onUncaughtException);
  await handle.close();
};

await main(argv);

/* eslint-disable local/strict-console */

import { open, readdir } from "node:fs/promises";
import { scrape } from "./scrape.mjs";
import { argv, cpuUsage, stdout } from "node:process";
import { runTest } from "./test.mjs";
import { home } from "./home.mjs";
import { inspectErrorMessage, inspectErrorName } from "./error-serial.mjs";
import { isStageName, loadStage } from "./stage.mjs";
import {
  compileFetchHarness,
  compileFetchTarget,
  resolveDependency,
  toMainPath,
} from "./fetch.mjs";
import { packResult } from "./result.mjs";

const { Date, console, process, URL, JSON, Map } = globalThis;

let instrument_user_time = 0;

let instrument_system_time = 0;

/**
 * @type {(
 *   path: import("./fetch").MainPath,
 *   stage: import("./stage").ReadyStage,
 *   fetch: import("./fetch").Fetch,
 * ) => Promise<import("./result").Result>}
 */
const test = async (
  path,
  { listLateNegative, instrument, setup, listExclusionReason, listNegative },
  { resolveDependency, fetchHarness, fetchTarget },
) => {
  const exclusion_tag_array = listExclusionReason(path);
  if (exclusion_tag_array.length === 0) {
    instrument_user_time = 0;
    instrument_system_time = 0;
    const start = cpuUsage();
    const { metadata, outcome } = await runTest(path, {
      setup,
      instrument,
      fetchTarget,
      fetchHarness,
      resolveDependency,
    });
    const stop = cpuUsage(start);
    return {
      type: "include",
      path,
      time: {
        total: {
          user: stop.user,
          system: stop.system,
        },
        instrument: {
          user: instrument_user_time,
          system: instrument_system_time,
        },
      },
      exclusion: [],
      expect: [
        ...listNegative(path),
        ...(outcome.type === "failure"
          ? listLateNegative(path, metadata, outcome.data)
          : []),
      ],
      actual: outcome.type === "failure" ? outcome.data.name : null,
    };
  } else {
    return {
      type: "exclude",
      path,
      exclusion: /** @type {[string, ...string[]]} */ (exclusion_tag_array),
      actual: null,
      expect: null,
      time: null,
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
      const start = cpuUsage();
      const outcome = instrument(source);
      const stop = cpuUsage(start);
      instrument_user_time += stop.user;
      instrument_system_time += stop.system;
      return outcome;
    }
  };
};

/**
 * @type {(
 *   argv: string[],
 * ) => Promise<void>}
 */
const main = async (argv) => {
  if (argv.length !== 1) {
    stdout.write(
      "usage: node --experimental-vm-modules --expose-gc test/262/exec.mjs <stage>\n",
    );
  } else {
    const stage_name = argv[0];
    if (!isStageName(stage_name)) {
      stdout.write(`invalid stage: ${stage_name}\n`);
    } else {
      if (isStageName(stage_name)) {
        const start = Date.now();
        const stage = await loadStage(stage_name);
        stage.instrument = wrapInstrument(stage.instrument);
        let sigint = false;
        const onSigint = () => {
          sigint = true;
        };
        process.addListener("SIGINT", onSigint);
        const onUncaughtException = (/** @type {unknown} */ error) => {
          console.log(
            `${inspectErrorName(error)}: ${inspectErrorMessage(error)}`,
          );
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
            stream.write(
              JSON.stringify(packResult(await test(path, stage, fetch))) + "\n",
            );
            index += 1;
          }
        }
        process.removeListener("SIGINT", onSigint);
        process.removeListener("uncaughtException", onUncaughtException);
        await handle.close();
        stdout.write(`Total time: ${Date.now() - start}ms\n`);
      }
    }
  }
};

await main(argv.slice(2));

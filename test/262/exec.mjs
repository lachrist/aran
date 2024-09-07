/* eslint-disable local/strict-console */

import { open } from "node:fs/promises";
import { scrape } from "./scrape.mjs";
import { argv, cpuUsage } from "node:process";
import { isTestCase, runTest } from "./test.mjs";
import { home, toTarget } from "./home.mjs";
import { inspectErrorMessage, inspectErrorName } from "./error-serial.mjs";
import { listTag, loadTagging } from "./tagging.mjs";
import { listPrecursor, loadPrecursor } from "./precursor.mjs";

const { Error, console, process, URL, JSON } = globalThis;

/**
 * @type {(
 *   target: string,
 *   options: {
 *     listLateNegative: import("./stage").Stage["listLateNegative"],
 *     compileInstrument: import("./stage").Stage["compileInstrument"],
 *     precursor: import("./precursor").Precursor,
 *     exclude: import("./tagging").Tagging,
 *     negative: import("./tagging").Tagging,
 *   },
 * ) => Promise<import("./result").Result>}
 */
const test = async (
  target,
  { listLateNegative, compileInstrument, precursor, exclude, negative },
) => {
  const reasons = [
    ...listPrecursor(precursor, target),
    ...listTag(exclude, target),
  ];
  if (reasons.length === 0) {
    const timer = cpuUsage();
    const { metadata, error } = await runTest({
      target,
      home,
      record: (source) => source,
      warning: "ignore",
      compileInstrument,
    });
    return {
      type: "include",
      path: target,
      time: cpuUsage(timer),
      expect: [
        ...listTag(negative, target),
        ...(error === null ? [] : listLateNegative(target, metadata, error)),
      ],
      actual:
        error === null
          ? null
          : {
              ...error,
              stack: null,
            },
    };
  } else {
    return {
      type: "exclude",
      path: target,
      reasons,
    };
  }
};

/**
 * @type {(
 *   argv: string[],
 * ) => Promise<void>}
 */
const main = async (argv) => {
  if (argv.length < 3) {
    throw new Error(
      "usage: node --experimental-vm-modules --expose-gc test/262/exec.mjs <stage> [...argv]",
    );
  }
  const [_node, _main, stage_name] = argv;
  const stage = /** @type {{default: import("./stage").Stage}} */ (
    await import(`./stages/${stage_name}.mjs`)
  ).default;
  const options = {
    listLateNegative: stage.listLateNegative,
    compileInstrument: stage.compileInstrument,
    precursor: await loadPrecursor(stage.precursor),
    exclude: await loadTagging(stage.exclude),
    negative: await loadTagging(stage.negative),
  };
  let sigint = false;
  const onSigint = () => {
    sigint = true;
  };
  process.addListener("SIGINT", onSigint);
  const onUncaughtException = (error) => {
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
  for await (const url of scrape(new URL("test/", home))) {
    if (sigint) {
      // eslint-disable-next-line local/no-label
      break;
    }
    if (index % 100 === 0) {
      console.dir(index);
    }
    const target = toTarget(url);
    if (isTestCase(target)) {
      stream.write(JSON.stringify(await test(target, options)) + "\n");
    }
    index += 1;
  }
  process.removeListener("SIGINT", onSigint);
  process.removeListener("uncaughtException", onUncaughtException);
  await handle.close();
};

await main(argv);

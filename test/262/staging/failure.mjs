/* eslint-disable local/no-function */

import { open } from "node:fs/promises";
import { createInterface } from "node:readline";

const { URL, Infinity } = globalThis;

/**
 * @type {(
 *   name: import("./stage-name").StageName,
 * ) => URL}
 */
const locateFailure = (stage) =>
  new URL(`failure/${stage}.txt`, import.meta.url);

/**
 * @type {(
 *   stage: import("./stage-name").StageName,
 * ) => AsyncGenerator<import("../result").TestSpecifier>}
 */
export const loadStageFailure = async function* (stage) {
  const handle = await open(locateFailure(stage), "r");
  try {
    const iterable = createInterface({
      input: handle.createReadStream({ encoding: "utf-8" }),
      crlfDelay: Infinity,
    });
    for await (const line of iterable) {
      if (line !== "") {
        yield /** @type {import("../result").TestSpecifier} */ (line);
      }
    }
  } finally {
    await handle.close();
  }
};

/**
 * @type {(
 *   stage: import("./stage-name").StageName,
 *   fails: AsyncIterable<import("../result").TestSpecifier>,
 * ) => Promise<void>}
 */
export const saveStageFailure = async (stage, fails) => {
  const handle = await open(locateFailure(stage), "w");
  try {
    const stream = handle.createWriteStream({ encoding: "utf-8" });
    for await (const fail of fails) {
      stream.write(`${fail}\n`);
    }
  } finally {
    await handle.close();
  }
};

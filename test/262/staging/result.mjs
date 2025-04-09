import { open } from "node:fs/promises";
import { packResult, unpackResult } from "../result.mjs";
import { createInterface } from "node:readline/promises";

const { URL, JSON, Infinity } = globalThis;

/**
 * @type {(
 *   name: import("./stage-name.d.ts").StageName,
 * ) => URL}
 */
const locateResult = (stage) =>
  new URL(`spec/${stage}-result.jsonl`, import.meta.url);

/**
 * @type {(
 *   stage: import("./stage-name.d.ts").StageName,
 * ) => AsyncGenerator<[
 *   import("../test-case.d.ts").TestIndex,
 *   import("../result.d.ts").Result,
 * ]>}
 */
export const loadStageResult = async function* (stage) {
  const handle = await open(locateResult(stage), "r");
  try {
    const iterable = createInterface({
      input: handle.createReadStream({ encoding: "utf-8" }),
      crlfDelay: Infinity,
    });
    let index = 0;
    for await (const line of iterable) {
      if (line.trim() !== "") {
        yield [
          /** @type {import("../test-case.d.ts").TestIndex} */ (index),
          unpackResult(JSON.parse(line)),
        ];
      }
      index++;
    }
  } finally {
    await handle.close();
  }
};

/**
 * @type {(
 *   stage: import("./stage-name.d.ts").StageName,
 *   results: AsyncIterable<import("../result.d.ts").Result>,
 * ) => Promise<void>}
 */
export const saveStageResult = async (stage, results) => {
  const handle = await open(locateResult(stage), "w");
  try {
    const stream = handle.createWriteStream({ encoding: "utf-8" });
    for await (const result of results) {
      stream.write(`${JSON.stringify(packResult(result))}\n`);
    }
  } finally {
    await handle.close();
  }
};

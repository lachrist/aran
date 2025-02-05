import { open } from "node:fs/promises";
import { packResult, unpackResult } from "../result.mjs";
import { createInterface } from "node:readline/promises";

const { URL, JSON, Infinity } = globalThis;

/**
 * @type {(
 *   name: import("./stage-name").StageName,
 * ) => URL}
 */
const locateResult = (stage) =>
  new URL(`spec/${stage}-result.jsonl`, import.meta.url);

/**
 * @type {(
 *   stage: import("./stage-name").StageName,
 * ) => AsyncGenerator<import("../result").Result>}
 */
export const loadStageResult = async function* (stage) {
  const handle = await open(locateResult(stage), "r");
  try {
    const iterable = createInterface({
      input: handle.createReadStream({ encoding: "utf-8" }),
      crlfDelay: Infinity,
    });
    for await (const line of iterable) {
      if (line !== "") {
        yield unpackResult(JSON.parse(line));
      }
    }
  } finally {
    await handle.close();
  }
};

/**
 * @type {(
 *   stage: import("./stage-name").StageName,
 *   results: AsyncIterable<import("../result").Result>,
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

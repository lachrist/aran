import { createInterface } from "node:readline";
import { isCompactResult, unpackResult } from "../result.mjs";
import { createReadStream } from "node:fs";
import { AranExecError } from "../error.mjs";

const { URL, JSON, Infinity } = globalThis;

/**
 * @type {(
 *   stage: import("../stage").StageName,
 * ) => Promise<import("../result").Result[]>}
 */
export const loadResultArray = async (stage) => {
  const results = [];
  for await (const line of createInterface({
    input: createReadStream(
      new URL(`../stages/${stage}.jsonl`, import.meta.url),
    ),
    crlfDelay: Infinity,
  })) {
    const compact_result = JSON.parse(line);
    if (isCompactResult(compact_result)) {
      results.push(unpackResult(compact_result));
    } else {
      throw new AranExecError("invalid compact result", compact_result);
    }
  }
  return results;
};

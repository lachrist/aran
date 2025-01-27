import { createInterface } from "node:readline";
import { isCompactResultEntry, unpackResult } from "../result.mjs";
import { createReadStream } from "node:fs";
import { AranExecError } from "../error.mjs";

const { URL, JSON, Infinity } = globalThis;

/**
 * @type {(
 *   stage: import("../staging/stage-name").StageName,
 * ) => Promise<import("../result").ResultEntry[]>}
 */
export const loadResultArray = async (stage) => {
  /**
   * @type {import("../result").ResultEntry[]}
   */
  const entries = [];
  for await (const line of createInterface({
    input: createReadStream(
      new URL(`../stages/${stage}.jsonl`, import.meta.url),
    ),
    crlfDelay: Infinity,
  })) {
    const entry = JSON.parse(line);
    if (!isCompactResultEntry(entry)) {
      throw new AranExecError("invalid compact result", { entry });
    }
    entries.push([entry[0], unpackResult(entry[1])]);
  }
  return entries;
};

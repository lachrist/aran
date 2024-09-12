import { readFile } from "node:fs/promises";
import { AranExecError } from "./error.mjs";
import { getResultPath, isResultArray } from "./result.mjs";
import { unwrapSettleArray } from "./util.mjs";

const { JSON, Set, URL, Promise } = globalThis;

/**
 * @type {(
 *   stage: string,
 * ) => Promise<import("./precursor").PrecursorEntry>}
 */
const loadPrecursorEntry = async (stage) => {
  const data = JSON.parse(
    await readFile(new URL(`./stages/${stage}.jsonl`, import.meta.url), "utf8"),
  );
  if (isResultArray(data)) {
    return [new Set(data.map(getResultPath)), stage];
  } else {
    throw new AranExecError("invalid result file");
  }
};

/**
 * @type {(
 *   stages: string[]
 * ) => Promise<import("./precursor").Precursor>}
 */
export const loadPrecursor = async (stages) =>
  unwrapSettleArray(await Promise.allSettled(stages.map(loadPrecursorEntry)));

/**
 * @type {(
 *   precursor: import("./precursor").Precursor,
 *   target: string,
 * ) => string[]}
 */
export const listPrecursor = (precursor, target) => {
  const stages = [];
  for (const [set, stage] of precursor) {
    if (set.has(target)) {
      stages.push(stage);
    }
  }
  return stages;
};

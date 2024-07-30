import { readFile } from "node:fs/promises";
import { AranExecError } from "./error.mjs";
import { getResultPath, isResultArray } from "./result.mjs";

const { JSON, Set, URL, Promise } = globalThis;

/**
 * @type {(
 *   stage: string,
 * ) => Promise<[Set<string>, string]>}
 */
const loadPrecursorEntry = async (stage) => {
  const data = JSON.parse(
    await readFile(new URL(`./stages/${stage}.json`, import.meta.url), "utf8"),
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
 * ) => Promise<[Set<string>, string][]>}
 */
export const loadPrecursor = (stages) =>
  Promise.all(stages.map(loadPrecursorEntry));

/**
 * @type {(
 *   precursor: [Set<string>, string][],
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

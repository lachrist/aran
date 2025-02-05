import { open } from "node:fs/promises";
import { createInterface } from "node:readline";

const { Map, Set, URL, Infinity } = globalThis;

/**
 * @type {(
 *   name: import("./stage-name").StageName,
 * ) => URL}
 */
const locateFailure = (stage) =>
  new URL(`spec/${stage}-failure.txt`, import.meta.url);

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
 * ) => Promise<Set<import("../result").TestSpecifier>>}
 */
export const listStageFailure = async (stage) => {
  /** @type {Set<import("../result").TestSpecifier>} */
  const set = new Set();
  for await (const failure of loadStageFailure(stage)) {
    set.add(failure);
  }
  return set;
};

/**
 * @type {(
 *   stages: import("./stage-name").StageName[],
 * ) => Promise<(
 *   specifier: import("../result").TestSpecifier,
 * ) => import("./stage-name").StageName[]>}
 */
export const compileListPrecursorFailure = async (stages) => {
  /**
   * @type {Map<
   *   import("../result").TestSpecifier,
   *   import("./stage-name").StageName[]
   * >}
   */
  const map = new Map();
  for (const stage of stages) {
    for await (const failure of loadStageFailure(stage)) {
      const stages = map.get(failure);
      if (stages == null) {
        map.set(failure, [stage]);
      } else {
        stages.push(stage);
      }
    }
  }
  return (specifier) => map.get(specifier) || [];
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

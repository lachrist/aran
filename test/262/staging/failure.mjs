import { loadStageResult } from "./result.mjs";
import { AranTypeError } from "../error.mjs";

const { Map } = globalThis;

/**
 * @type {(
 *   stage: import("./stage-name").StageName,
 * ) => AsyncGenerator<import("../test-case").TestIndex>}
 */
export const loadStageFailure = async function* (stage) {
  for await (const [index, result] of loadStageResult(stage)) {
    if (result.type === "include") {
      if (result.actual !== null || result.expect.length > 0) {
        yield index;
      }
    } else if (result.type === "exclude") {
      yield index;
    } else {
      throw new AranTypeError(result);
    }
  }
};

/**
 * @type {(
 *   stages: import("./stage-name").StageName[],
 * ) => Promise<(
 *   index: import("../test-case").TestIndex,
 * ) => import("./stage-name").StageName[]>}
 */
export const compileListPrecursorFailure = async (stages) => {
  /**
   * @type {Map<
   *   import("../test-case").TestIndex,
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
  return (index) => map.get(index) || [];
};

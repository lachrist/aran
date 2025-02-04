import {
  closeQueue,
  createQueue,
  pullQueue,
  pushQueue,
} from "../util/index.mjs";
import { saveStageFailure } from "./failure.mjs";
import { saveStageResult } from "./result.mjs";

const { Symbol } = globalThis;

/**
 * @type {(
 *   stage: import("./stage-name").StageName,
 *   entries: AsyncIterable<import("../result").ResultEntry>,
 * ) => AsyncGenerator<import("../result").Result>}
 */
const filterFailure = async function* (stage, entries) {
  /** @type {import("../util/queue").Queue<import("../result").TestSpecifier>} */
  const failures = createQueue();
  const promise = saveStageFailure(stage, {
    [Symbol.asyncIterator]: () => ({
      next: () => pullQueue(failures),
    }),
  });
  try {
    for await (const [specifier, result] of entries) {
      if (result.type === "exclude" || result.actual !== null) {
        pushQueue(failures, specifier);
      }
      yield result;
    }
  } finally {
    closeQueue(failures);
  }
  await promise;
};

/**
 * @type {(
 *   stage: import("./stage-name").StageName,
 *   entries: AsyncIterable<import("../result").ResultEntry>,
 * ) => Promise<void>}
 */
export const saveStageResultEntry = (stage, entries) =>
  saveStageResult(stage, filterFailure(stage, entries));

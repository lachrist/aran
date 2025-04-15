import { open } from "node:fs/promises";
import { AranExecError } from "../../../error.mjs";
import { createInterface } from "node:readline/promises";

const { Set, URL, isNaN, parseInt, Infinity } = globalThis;

export const threshold = 1024;

/**
 * @type {(
 *   include: "main" | "comp",
 * ) => Promise<Set<import("../../../test-case.d.ts").TestIndex>>}
 */
const loadThresholdExclusion = async (include) => {
  const handle = await open(
    new URL(`count/${include}-output.txt`, import.meta.url),
    "r",
  );
  try {
    const iterable = createInterface({
      input: handle.createReadStream({ encoding: "utf-8" }),
      crlfDelay: Infinity,
    });
    let index = 0;
    /** @type {Set<import("../../../test-case.d.ts").TestIndex>} */
    const exclusion = new Set();
    for await (const line of iterable) {
      if (line.trim() !== "") {
        const count = parseInt(line);
        if (isNaN(count)) {
          throw new AranExecError("invalid count", { count });
        }
        if (count > threshold) {
          exclusion.add(
            /** @type {import("../../../test-case.d.ts").TestIndex} */ (index),
          );
        }
      }
      index++;
    }
    return exclusion;
  } finally {
    await handle.close();
  }
};

/**
 * @type {(
 *   include: "main" | "comp",
 * ) => Promise<(
 *   index: import("../../../test-case.d.ts").TestIndex,
 * ) => import("../../../tagging/tag.d.ts").Tag[]>}
 */
export const compileListThresholdExclusion = async (include) => {
  const exclusion = await loadThresholdExclusion(include);
  return (index) =>
    exclusion.has(index)
      ? [/** @type {import("../../../tagging/tag.d.ts").Tag} */ ("threshold")]
      : [];
};

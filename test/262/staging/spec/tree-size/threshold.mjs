import { open } from "node:fs/promises";
import { AranExecError } from "../../../error.mjs";
import { createInterface } from "node:readline/promises";

const { Set, URL, isNaN, parseInt, Infinity } = globalThis;

/**
 * @typedef {{
 *   specifier: import("../../../result").TestSpecifier,
 *   count: number,
 * }} Entry
 */

export const threshold = 512;

/**
 * @type {() => Promise<Set<import("../../../test-case").TestIndex>>}
 */
const loadThresholdExclusion = async () => {
  const handle = await open(new URL("count/data.txt", import.meta.url), "r");
  try {
    const iterable = createInterface({
      input: handle.createReadStream({ encoding: "utf-8" }),
      crlfDelay: Infinity,
    });
    let index = 0;
    /** @type {Set<import("../../../test-case").TestIndex>} */
    const exclusion = new Set();
    for await (const line of iterable) {
      if (line.trim() !== "") {
        const count = parseInt(line);
        if (isNaN(count)) {
          throw new AranExecError("invalid count", { count });
        }
        if (count > threshold) {
          exclusion.add(
            /** @type {import("../../../test-case").TestIndex} */ (index),
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

const exclusion = await loadThresholdExclusion();

/**
 * @type {(
 *   index: import("../../../test-case").TestIndex,
 * ) => import("../../../tagging/tag").Tag[]}
 */
export const listThresholdExclusion = (index) =>
  exclusion.has(index)
    ? [/** @type {import("../../../tagging/tag").Tag} */ ("threshold")]
    : [];

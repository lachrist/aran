import { open, writeFile } from "node:fs/promises";
import { AranExecError } from "../../../../error.mjs";
import { createInterface } from "node:readline/promises";
import { parseBranching } from "../branching.mjs";

const { Math, URL, Array, Infinity, Symbol, isNaN } = globalThis;

//////////
// Util //
//////////

/**
 * @type {(
 *    handle: import("node:fs/promises").FileHandle,
 * ) => AsyncIterator<string>}
 */
const createIterable = (handle) =>
  createInterface({
    input: handle.createReadStream({ encoding: "utf-8" }),
    crlfDelay: Infinity,
  })[Symbol.asyncIterator]();

/**
 * @type {(
 *   num1: number,
 *   num2: number,
 * ) => number}
 */
const add = (num1, num2) => num1 + num2;

/**
 * @type {(
 *   numbers: number[],
 * ) => number}
 */
const sum = (numbers) => numbers.reduce(add, 0);

/**
 * @type {<X>(
 *   value: X | null,
 * ) => value is X}
 */
const isNotNull = (value) => value !== null;

/**
 * @type {(
 *   string: string,
 * ) => boolean}
 */
const isNotEmptyString = (string) => string !== "";

/**
 * @type {(
 *   arrays: {length: number}[],
 * ) => number | null}
 */
const getCommonLength = (arrays) => {
  const { length } = arrays;
  if (length === 0) {
    return null;
  }
  const base_length = arrays[0].length;
  for (let index = 1; index < length; index++) {
    const { length } = arrays[index];
    if (length !== base_length) {
      return null;
    }
  }
  return base_length;
};

/**
 * @type {(
 *   val1: number,
 *   val2: number,
 * ) => number}
 */
const computePercentIncrease = (val1, val2) => {
  const result = Math.round((100 * (val2 - val1)) / val1);
  if (isNaN(result)) {
    return 0;
  } else if (result === Infinity) {
    return 2 ** 32;
  } else if (result === -Infinity) {
    return (-2) ** 32;
  } else {
    return result;
  }
};

/**
 * @type {(
 *   nums1: number[],
 *   nums2: number[],
 * ) => number[]}
 */
const computeEachPercentIncrease = (nums1, nums2) => {
  const length = getCommonLength([nums1, nums2]);
  if (length === null) {
    throw new AranExecError("no common length", { nums1, nums2 });
  }
  const result = [];
  for (let index = 0; index < length; index++) {
    result.push(computePercentIncrease(nums1[index], nums2[index]));
  }
  return result;
};

//////////
// Type //
//////////

/**
 * @typedef {number & { __brand: "Hash" }} Hash
 * @typedef {number & { __brand: "Size" }} Size
 * @typedef {Size[]} Test
 * @typedef {Test[]} Suite
 * @typedef {(
 *   | "stack-main"
 *   | "stack-comp"
 *   | "intra-main"
 *   | "intra-comp"
 *   | "inter-main"
 *   | "inter-comp"
 *   | "store-main"
 *   | "store-comp"
 * )} SuiteName
 */

//////////
// Load //
//////////

/**
 * @type {(
 *   hashing: Hash[][],
 * ) => null | string}
 */
const verifyHashing = (hashing) => {
  const length = getCommonLength(hashing);
  if (length === null) {
    return "length mismatch";
  }
  for (let index = 0; index < length; index++) {
    const base = hashing[0][index];
    for (const hashes of hashing) {
      if (hashes[index] !== base) {
        return `hash mismatch at ${index} between ${hashes[index]} and ${base}`;
      }
    }
  }
  return null;
};

/**
 * @type {(
 *   name: SuiteName,
 * ) => URL}
 */
const locateStageOutput = (name) =>
  new URL(`../track/${name}-output.jsonl`, import.meta.url);

/**
 * @type {(
 *   names: SuiteName[],
 * ) => Promise<[SuiteName, Suite][]>}
 */
const loadSuiteRecord = async (names) => {
  const handles = [];
  try {
    for (const name of names) {
      handles.push(await open(locateStageOutput(name), "r"));
    }
    const iterators = handles.map(createIterable);
    /**
     * @type {Suite[]}
     */
    const suites = Array.from({ length: iterators.length }, () => []);
    let test_index = 0;
    const suite_length = suites.length;
    while (true) {
      /**
       * @type {(string | null)[]}
       */
      const lines = [];
      for (const iterator of iterators) {
        const { value, done } = await iterator.next();
        lines.push(done ? null : value);
      }
      if (lines.every(isNotNull)) {
        if (lines.every(isNotEmptyString)) {
          /** @type {Hash[][]} */
          const hashing = [];
          for (let suite_index = 0; suite_index < suite_length; suite_index++) {
            /**
             * @type {(string | number)[]}
             */
            const hashes = [];
            /**
             * @type {number[]}
             */
            const sizes = [];
            for (const { path, type, size } of parseBranching(
              lines[suite_index],
            )) {
              hashes.push(path);
              if (type === "IfStatement" || type === "ConditionalExpression") {
                sizes.push(size);
              }
            }
            suites[suite_index].push(/** @type {Size[]} */ (sizes));
            hashing.push(/** @type {Hash[]} */ (hashes));
          }
          const status = verifyHashing(hashing);
          if (status !== null) {
            throw new AranExecError(status, {
              names,
              test_index,
              hashing,
            });
          }
        } else {
          if (lines.some(isNotEmptyString)) {
            throw new AranExecError("mismatched exclusion", {
              names,
              test_index,
              lines,
            });
          }
        }
      } else {
        if (lines.some(isNotNull)) {
          throw new AranExecError("mismatched suite length", {
            names,
            index: test_index,
            lines,
          });
        }
        break;
      }
      test_index++;
    }
    return suites.map((_, index) => [names[index], suites[index]]);
  } finally {
    for (const handle of handles) {
      await handle.close();
    }
  }
};

//////////
// Main //
//////////

/**
 * @type {["stack", "intra", "inter", "store"]}
 */
const trackings = ["stack", "intra", "inter", "store"];

/**
 * @type {(
 *   tracking: "stack" | "intra" | "inter" | "store",
 *   include: "main" | "comp",
 * ) => SuiteName}
 */
const toSuiteName = (tracking, include) => `${tracking}-${include}`;

/**
 * @type {(
 *   include: "main" | "comp",
 * ) => Promise<void>}
 */
const main = async (include) => {
  const suites = await loadSuiteRecord(
    trackings.map((tracking) => toSuiteName(tracking, include)),
  );
  for (const [name, suite] of suites) {
    await writeFile(
      new URL(`../output/${name}-flat.txt`, import.meta.url),
      suite.flat(1).join("\n") + "\n",
      "utf8",
    );
    await writeFile(
      new URL(`../output/${name}-aggr.txt`, import.meta.url),
      suite.map(sum).join("\n") + "\n",
      "utf8",
    );
  }
  {
    const flat = suites[0][1].flat(1);
    const aggr = suites[0][1].map(sum);
    for (const [name, suite] of suites) {
      await writeFile(
        new URL(`../output/${name}-flat-ratio.txt`, import.meta.url),
        computeEachPercentIncrease(flat, suite.flat(1)).join("\n") + "\n",
        "utf8",
      );
      await writeFile(
        new URL(`../output/${name}-aggr-ratio.txt`, import.meta.url),
        computeEachPercentIncrease(aggr, suite.map(sum)).join("\n") + "\n",
        "utf8",
      );
    }
  }
};

await main("main");
await main("comp");

import { open, writeFile } from "node:fs/promises";
import { AranExecError } from "../../../../error.mjs";
import { createInterface } from "node:readline/promises";
import { parseBranching } from "../branching.mjs";

const { Math, URL, Array, Infinity, Symbol } = globalThis;

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
 * ) => number}
 */
const getCommonLength = (arrays) => {
  const { length } = arrays;
  if (length === 0) {
    throw new AranExecError("no common length", { arrays });
  }
  const base_length = arrays[0].length;
  for (let index = 0; index < length; index++) {
    const { length } = arrays[index];
    if (length !== base_length) {
      throw new AranExecError("no common length", {
        index,
        length,
        base_length,
        arrays,
      });
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
  if (val1 === 0 && val2 === 0) {
    return 0;
  }
  if (val1 === 0) {
    throw new AranExecError("divident is zero", { val1, val2 });
  }
  if (val2 === 0) {
    throw new AranExecError("divisor is zero", { val1, val2 });
  }
  return Math.round((100 * (val2 - val1)) / val1);
};

/**
 * @type {(
 *   nums1: number[],
 *   nums2: number[],
 * ) => number[]}
 */
const computeEachPercentIncrease = (nums1, nums2) => {
  const length = getCommonLength([nums1, nums2]);
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
 *   | "intra-main"
 *   | "intra-comp"
 *   | "inter-main"
 *   | "inter-comp"
 * )} SuiteName
 */

//////////
// Load //
//////////

/**
 * @type {(
 *   hashing: Hash[][],
 *   location: number,
 * ) => void}
 */
const verifyHashing = (hashing, location) => {
  const length = getCommonLength(hashing);
  for (let index = 0; index < length; index++) {
    const base = hashing[0][index];
    for (const hashes of hashing) {
      if (hashes[index] !== base) {
        throw new AranExecError("mismatched hashing", {
          location,
          index,
          hashes,
        });
      }
    }
  }
};

/**
 * @type {(
 *   name: SuiteName,
 * ) => URL}
 */
const locateStageOutput = (name) =>
  new URL(`../basic/stage-${name}-output.jsonl`, import.meta.url);

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
    let index = 0;
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
          let index = 0;
          /** @type {Hash[][]} */
          const hashing = [];
          for (const [sizes, hashes] of lines.map(parseBranching)) {
            suites[index].push(/** @type {Size[]} */ (sizes));
            hashing.push(/** @type {Hash[]} */ (hashes));
            index++;
          }
          verifyHashing(hashing, index);
        } else {
          if (lines.some(isNotEmptyString)) {
            throw new AranExecError("mismatched exclusion", {
              names,
              index,
              lines,
            });
          }
        }
      } else {
        if (lines.some(isNotNull)) {
          throw new AranExecError("mismatched suite length", {
            names,
            index,
            lines,
          });
        }
        break;
      }
      index++;
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
 * @type {["intra", "inter"]}
 */
const kinds = ["intra", "inter"];

/**
 * @type {(
 *   kind: "intra" | "inter",
 *   include: "main" | "comp",
 * ) => SuiteName}
 */
const toSuiteName = (kind, include) => `${kind}-${include}`;

/**
 * @type {(
 *   include: "main" | "comp",
 * ) => Promise<void>}
 */
const main = async (include) => {
  const suites = await loadSuiteRecord(
    kinds.map((kind) => toSuiteName(kind, include)),
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
  await writeFile(
    new URL("../output/ratio-flat.txt", import.meta.url),
    computeEachPercentIncrease(suites[0][1].flat(1), suites[1][1].flat(1)).join(
      "\n",
    ) + "\n",
    "utf8",
  );
  await writeFile(
    new URL("../output/ratio-aggr.txt", import.meta.url),
    computeEachPercentIncrease(
      suites[0][1].map(sum),
      suites[0][1].map(sum),
    ).join("\n") + "\n",
    "utf8",
  );
};

await main("main");
await main("comp");

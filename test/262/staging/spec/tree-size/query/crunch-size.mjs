import { open, writeFile } from "node:fs/promises";
import { AranExecError } from "../../../../error.mjs";
import { createInterface } from "node:readline/promises";

const { Object, Math, URL, JSON, Array, Infinity, Symbol } = globalThis;

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
 * @type {(
 *   table: number[][],
 * ) => number[]}
 */
const sumEach = (table) => table.map(sum);

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
 * @type {<X>(
 *   table: X[][],
 * ) => X[]}
 */
const flaten = (table) => table.flat(1);

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
 * @typedef {"intra" | "inter"} SuiteName
 * @typedef {Record<SuiteName, Suite>} SuiteRecord
 */

//////////
// Load //
//////////

/**
 * @type {(
 *   line: string,
 * ) => [Size[], Hash[]]}
 */
const parseLine = (line) => {
  const data = JSON.parse(line);
  if (!Array.isArray(data)) {
    throw new AranExecError("not an array", { data });
  }
  if (data.length % 2 !== 0) {
    throw new AranExecError("odd length", { data });
  }
  const sizes = [];
  const hashes = [];
  for (let index = 0; index < data.length; index += 2) {
    sizes.push(data[index]);
    hashes.push(data[index + 1]);
  }
  return [sizes, hashes];
};

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
 *   urls: URL[],
 * ) => Promise<Suite[]>}
 */
const loadSuiteRecord = async (urls) => {
  const handles = [];
  try {
    for (const url of urls) {
      handles.push(await open(url, "r"));
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
          const hashing = [];
          for (const [sizes, hashes] of lines.map(parseLine)) {
            suites[index].push(sizes);
            hashing.push(hashes);
            index++;
          }
          verifyHashing(hashing, index);
        } else {
          if (lines.some(isNotEmptyString)) {
            throw new AranExecError("mismatched exclusion", { index, lines });
          }
        }
      } else {
        if (lines.some(isNotNull)) {
          throw new AranExecError("mismatched suite length", { index, lines });
        }
        break;
      }
      index++;
    }
    return suites;
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
 * @type {{[key in SuiteName]: null}}
 */
const suite_name_record = {
  intra: null,
  inter: null,
};

const suite_name_enum = /** @type {SuiteName[]} */ (
  Object.keys(suite_name_record)
);

/**
 * @type {(
 *   procedural: "inter" | "intra",
 * ) => URL}
 */
const locateStageOutput = (procedural) =>
  new URL(`../basic/stage-${procedural}-output.jsonl`, import.meta.url);

const main = async () => {
  const suites = await loadSuiteRecord(suite_name_enum.map(locateStageOutput));
  const flatening = suites.map(flaten);
  const aggregate = suites.map(sumEach);
  {
    let index = 0;
    for (const name of suite_name_enum) {
      await writeFile(
        new URL(`../output/${name}-flat.txt`, import.meta.url),
        flatening[index].join("\n") + "\n",
        "utf8",
      );
      await writeFile(
        new URL(`../output/${name}-aggr.txt`, import.meta.url),
        aggregate[index].join("\n") + "\n",
        "utf8",
      );
      index++;
    }
  }
  await writeFile(
    new URL("../output/ratio-flat.txt", import.meta.url),
    computeEachPercentIncrease(flatening[0], flatening[1]).join("\n") + "\n",
    "utf8",
  );
  await writeFile(
    new URL("../output/ratio-aggr.txt", import.meta.url),
    computeEachPercentIncrease(aggregate[0], aggregate[1]).join("\n") + "\n",
    "utf8",
  );
};

await main();

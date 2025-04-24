import { open, writeFile } from "node:fs/promises";
import { AranExecError } from "../../../../error.mjs";
import { createInterface } from "node:readline/promises";
import { parseBranching } from "../branching.mjs";

const { Math, URL, Array, Infinity, Symbol, isNaN } = globalThis;

/**
 * @typedef {"stack" | "intra" | "inter" | "store"} Tracking
 * @typedef {"main" | "comp"} Include
 */

//////////
// Util //
//////////

/**
 * @type {(
 *   array: unknown[],
 * ) => boolean}
 */
const isNotEmpty = (array) => array.length > 0;

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
 * @typedef {number & { __brand: "Prov" }} Prov
 * @typedef {Prov[]} Test
 * @typedef {Test[]} Suite
 * @typedef {(
 *   | "stack-main"
 *   | "stack-comp"
 *   | "intra-main"
 *   | "intra-comp"
 *   | "inter-main"
 *   | "inter-comp"
 *   | "store-main"
 *   | "store-comp-internal"
 *   | "store-comp-external"
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

const deviation1 = [
  // test/262/test262/test/built-ins/Array/prototype/sort
  6920, 6921, 6922, 6923, 6924, 6925, 6926, 6927, 6928, 6929, 6930, 6931, 6993,
  6994, 6997, 6998,
  // test/262/test262/test/language/statements/function/S13.2.1_A5_T1.js
  89245, 89246,
];

// Node.js actually closes the iterator but catch and ignore the error
// built-ins/Object/fromEntries/iterator-not-closed-for-next-returning-non-object.js
const deviation2 = [20501, 20502, 20503, 20504, 20505, 20506, 20507, 20508];

// Could be because of time sensitive test, not sure
// built-ins/Date/S15.9.2.1_A2.js >> @use-strict
const deviation3 = [10230];

// unknown
const deviation4 = [50277, 50419, 50420];

const deviation = [...deviation1, ...deviation2, ...deviation3, ...deviation4];

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
          /** @type {Prov[][]} */
          const sizing = [];
          for (let suite_index = 0; suite_index < suite_length; suite_index++) {
            /** @type {(string | number)[]} */
            const hashes = [];
            /** @type {number[]} */
            const provs = [];
            const line = lines[suite_index];
            for (const { path, type, prov } of parseBranching(line)) {
              hashes.push(path);
              if (
                type === "IfStatement" ||
                type === "SwitchStatement" ||
                type === "WhileStatement" ||
                type === "DoWhileStatement" ||
                type === "ForInStatement" ||
                type === "ForOfStatement" ||
                type === "ForStatement" ||
                type === "ConditionalExpression" ||
                type === "LogicalExpression"
              ) {
                provs.push(prov);
              }
            }
            sizing.push(/** @type {Prov[]} */ (provs));
            hashing.push(/** @type {Hash[]} */ (hashes));
          }
          const status = verifyHashing(hashing);
          if (status !== null) {
            if (!deviation.includes(test_index)) {
              throw new AranExecError("unexpected deviation", {
                names,
                test_index,
                status,
              });
            }
          } else {
            for (
              let suite_index = 0;
              suite_index < suite_length;
              suite_index++
            ) {
              suites[suite_index].push(sizing[suite_index]);
            }
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
 * @type {Tracking[]}
 */
const trackings = ["stack", "intra", "inter", "store"];

/**
 * @type {(
 *   tracking: Tracking,
 *   include: Include
 * ) => SuiteName[]}
 */
const listSuiteName = (tracking, include) => {
  /** @type {`${Tracking}-${Include}`} */
  const name = `${tracking}-${include}`;
  return name === "store-comp"
    ? [`${name}-internal`, `${name}-external`]
    : [name];
};

/**
 * @type {(
 *   include: Include,
 * ) => Promise<void>}
 */
const main = async (include) => {
  const suites = await loadSuiteRecord(
    trackings.flatMap((tracking) => listSuiteName(tracking, include)),
  );
  for (const [name, suite] of suites) {
    await writeFile(
      new URL(`../output/${name}-flat.txt`, import.meta.url),
      suite.flat(1).join("\n") + "\n",
      "utf8",
    );
    await writeFile(
      new URL(`../output/${name}-aggr.txt`, import.meta.url),
      suite.filter(isNotEmpty).map(sum).join("\n") + "\n",
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

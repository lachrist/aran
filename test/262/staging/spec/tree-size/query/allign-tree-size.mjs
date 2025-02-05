import { readFile } from "node:fs/promises";
import { AranExecError } from "../../../../error.mjs";
import { isNotEmptyString } from "../../../../util/string.mjs";

const { Object, Math, URL, JSON, Array } = globalThis;

/**
 * @type {(
 *   array: unknown[],
 * ) => boolean}
 */
const isRepeatArray = (array) => {
  if (array.length === 0) {
    return true;
  } else {
    const base = array[0];
    const { length } = array;
    for (let index = 1; index < length; index++) {
      if (array[index] !== base) {
        return false;
      }
    }
    return true;
  }
};

/**
 * @type {<X>(
 *   array: X[],
 * ) => X}
 */
const reduceRepeat = (array) => {
  if (array.length === 0) {
    throw new AranExecError("empty array");
  }
  if (!isRepeatArray(array)) {
    throw new AranExecError("not a repeat array", { array });
  }
  return array[0];
};

/**
 * @typedef {number & { __brand: "Hash" }} Hash
 * @typedef {number & { __brand: "Size" }} Size
 * @typedef {number & { __brand: "BranchIndex" }} BranchIndex
 * @typedef {Record<BranchIndex, Size | Hash>} Test
 * @typedef {number & { __brand: "TestIndex" }} TestIndex
 * @typedef {Record<TestIndex, Test>} Suite
 * @typedef {"tree-size-intra" | "tree-size-inter"} SuiteName
 * @typedef {Record<SuiteName, Suite>} SuiteRecord
 */

////////////
// Access //
////////////

/**
 * @type {{[key in SuiteName]: null}}
 */
const stage_name_record = {
  "tree-size-intra": null,
  "tree-size-inter": null,
};

const stage_name_enum = /** @type {SuiteName[]} */ (
  Object.keys(stage_name_record)
);

/**
 * @type {(
 *   test: Test,
 *   index: BranchIndex,
 * ) => Size}
 */
const getTestSize = (test, index) =>
  /** @type {Size} */ (test[/** @type {BranchIndex} */ (2 * index)]);

/**
 * @type {(
 *   test: Test,
 *   index: BranchIndex,
 * ) => Hash}
 */
const getTestHash = (test, index) =>
  /** @type {Hash} */ (test[/** @type {BranchIndex} */ (2 * index + 1)]);

/**
 * @type {(
 *   suite: Suite,
 *   test_index: TestIndex,
 * ) => Test}
 */
const getSuiteTest = (suite, test_index) => suite[test_index];

/**
 * @type {(
 *   suite: Suite,
 * ) => number}
 */
const getSuiteLength = (suite) => /** @type {any} */ (suite).length;

/**
 * @type {(
 *   suites: Suite[],
 * ) => Iterable<TestIndex>}
 */
const iterateTestIndex = function* (suites) {
  const suite_length = reduceRepeat(suites.map(getSuiteLength));
  for (let test_index = 0; test_index < suite_length; test_index++) {
    yield /** @type {TestIndex} */ (test_index);
  }
};

/**
 * @type {(
 *   test: Test,
 * ) => number}
 */
const getTestLength = (test) => /** @type {any} */ (test).length;

/**
 * @type {(
 *   suites: Suite[],
 *   test_index: TestIndex,
 * ) => Iterable<BranchIndex>}
 */
const iterateBranchIndex = function* (suites, test_index) {
  const test_length = reduceRepeat(
    suites.map((suite) => getTestLength(getSuiteTest(suite, test_index))),
  );
  for (let branch_index = 0; branch_index < test_length; branch_index++) {
    yield /** @type {BranchIndex} */ (branch_index);
  }
};

////////////
// Crunch //
////////////

/**
 * @type {(
 *   suite1: Suite,
 *   suite2: Suite,
 *   test_index: TestIndex,
 *   branch_index: BranchIndex,
 * ) => number}
 */
const computeRatio = (suite1, suite2, test_index, branch_index) => {
  const size1 = getTestSize(getSuiteTest(suite1, test_index), branch_index);
  const size2 = getTestSize(getSuiteTest(suite2, test_index), branch_index);
  return Math.round((100 * size1) / size2) / 100;
};

/**
 * @type {(
 *   suite1: Suite,
 *   suite2: Suite,
 * ) => number[]}
 */
const crunch = (suite1, suite2) => {
  const ratio = [];
  const suites = [suite1, suite2];
  for (const test_index of iterateTestIndex(suites)) {
    for (const branch_index of iterateBranchIndex(suites, test_index)) {
      ratio.push(computeRatio(suite1, suite2, test_index, branch_index));
    }
  }
  return ratio;
};

//////////
// Load //
//////////

/**
 * @type {(
 *   suites: SuiteRecord,
 * ) => void}
 */
const verifySuiteRecord = (suite_record) => {
  for (const name of stage_name_enum) {
    if (!Object.hasOwn(suite_record, name)) {
      throw new AranExecError("missing suite", { name });
    }
  }
  const suites = Object.values(suite_record);
  for (const test_index of iterateTestIndex(suites)) {
    for (const branch_index of iterateBranchIndex(suites, test_index)) {
      const hashes = suites.map((suite) =>
        getTestHash(getSuiteTest(suite, test_index), branch_index),
      );
      if (!isRepeatArray(hashes)) {
        throw new AranExecError("hash mismatch", { hashes });
      }
    }
  }
};

/**
 * @type {(
 *   line: string,
 * ) => Test}
 */
const parseTest = (line) => {
  const data = JSON.parse(line);
  if (!Array.isArray(data)) {
    throw new AranExecError("not an array", { data });
  }
  for (const item of data) {
    if (typeof item !== "number") {
      throw new AranExecError("not a number", { data, item });
    }
  }
  return data;
};

/**
 * @type {(
 *   content: string,
 * ) => Suite}
 */
const parseSuite = (content) =>
  content.split("\n").filter(isNotEmptyString).map(parseTest);

/**
 * @type {() => Promise<SuiteRecord>}
 */
const loadSuiteRecord = async () => ({
  "tree-size-intra": parseSuite(
    await readFile(
      new URL("../staging/output/tree-size-intra.jsonl", import.meta.url),
      "utf-8",
    ),
  ),
  "tree-size-inter": parseSuite(
    await readFile(
      new URL("../staging/output/tree-size-inter.jsonl", import.meta.url),
      "utf-8",
    ),
  ),
});

//////////
// Main //
//////////

const main = async () => {
  const suites = await loadSuiteRecord();
  verifySuiteRecord(suites);
  console.log(crunch(suites["tree-size-intra"], suites["tree-size-inter"]));
};

await main();

// await main();

// /**
//  * @type {(
//  *   array: unknown[],
//  * ) => boolean}
//  */
// const isRepeatArray = (array) => {
//   const { length } = array;
//   if (length === 0) {
//     return true;
//   } else {
//     const base = array[0];
//     for (let index = 1; index < length; index++) {
//       if (array[index] !== base) {
//         return false;
//       }
//     }
//     return true;
//   }
// };

// /**
//  * @type {(
//  *   lines: number[][]
//  * ) => number[][]}
//  */
// const allignLine = (lines) => {
//   const trans = transpose(lines);
//   const { length } = trans;
//   if (length % 2 !== 0) {
//     throw new AranExecError("odd length", { length, trans });
//   }
//   for (let index = 0; index < length; index += 2) {
//     if (!isRepeatArray(trans[index + 1])) {
//       throw new AranExecError("hash mismatch", { index, trans });
//     }
//   }
//   return trans.filter(isSecondEven);
// };

// /**
//  * @type {(
//  *   matrices: number[][][],
//  * ) => number[][][]}
//  */
// export const allignMatrix = (matrices) => transpose(matrices).map(allignLine);

// /**
//  * @type {(
//  *   content: string,
//  * ) => number[][]}
//  */
// const loadMatrix = (content) =>
//   content.split("\n").filter(isNotEmptyString).map(parseLine);

// /**
//  * @type {(
//  *   comparisons: number[][],
//  * ) => number[]}
//  */
// const crunch = () => {};

// const main = async () => {
//   await writeFile(
//     new URL("../staging/output/tree-size.jsonl", import.meta.url),
//     JSON.stringify(
//       allignMatrix([
//         loadMatrix(
//           await readFile(
//             new URL("../staging/output/tree-size-intra.jsonl", import.meta.url),
//             "utf-8",
//           ),
//         ),
//         loadMatrix(
//           await readFile(
//             new URL("../staging/output/tree-size-inter.jsonl", import.meta.url),
//             "utf-8",
//           ),
//         ),
//       ]),
//       null,
//       2,
//     ),
//     "utf8",
//   );
// };

// await main();

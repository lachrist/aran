import { readFile, writeFile } from "node:fs/promises";
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
 * @type {(
 *   number1: number,
 *   number2: number,
 * ) => number}
 */
const computeRatio = (number1, number2) =>
  Math.round((10000 * number1) / number2) / 10000;

/**
 * @typedef {number & { __brand: "Hash" }} Hash
 * @typedef {number & { __brand: "Size" }} Size
 * @typedef {number & { __brand: "BranchIndex" }} BranchIndex
 * @typedef {Record<BranchIndex, Size | Hash>} Test
 * @typedef {number & { __brand: "TestIndex" }} TestIndex
 * @typedef {Record<TestIndex, Test>} Suite
 * @typedef {"intra" | "inter"} SuiteName
 * @typedef {Record<SuiteName, Suite>} SuiteRecord
 */

////////////
// Access //
////////////

/**
 * @type {{[key in SuiteName]: null}}
 */
const stage_name_record = {
  intra: null,
  inter: null,
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
 * ) => Size}
 */
const sumTest = (test) => {
  let total = 0;
  for (const branch_index of iterateBranchIndex([test])) {
    total += getTestSize(test, branch_index);
  }
  return /** @type {Size} */ (total);
};

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
 *   tests: Test[],
 * ) => Iterable<BranchIndex>}
 */
const iterateBranchIndex = function* (tests) {
  const test_length = reduceRepeat(tests.map(getTestLength));
  for (let branch_index = 0; branch_index < test_length; branch_index++) {
    yield /** @type {BranchIndex} */ (branch_index);
  }
};

///////////
// Ratio //
///////////

/**
 * @type {(
 *   suite1: Suite,
 *   suite2: Suite,
 * ) => number[]}
 */
const ratioBranch = (suite1, suite2) => {
  /** @type {number[]} */
  const ratios = [];
  for (const test_index of iterateTestIndex([suite1, suite2])) {
    const test1 = getSuiteTest(suite1, test_index);
    const test2 = getSuiteTest(suite2, test_index);
    for (const branch_index of iterateBranchIndex([test1, test2])) {
      ratios.push(
        computeRatio(
          getTestSize(test1, branch_index),
          getTestSize(test2, branch_index),
        ),
      );
    }
  }
  return ratios;
};

/**
 * @type {(
 *   suite1: Suite,
 *   suite2: Suite,
 * ) => number[]}
 */
const ratioTest = (suite1, suite2) => {
  const ratios = [];
  const suites = [suite1, suite2];
  for (const test_index of iterateTestIndex(suites)) {
    const sum1 = sumTest(getSuiteTest(suite1, test_index));
    const size1 = reduceRepeat(
      suites.map((suite) => getTestSize(getSuiteTest(suite, test_index), 0)),
    );
    const size2 = reduceRepeat(
      suites.map((suite) => getTestSize(getSuiteTest(suite, test_index), 1)),
    );
    ratio.push(Math.round((100 * size1) / size2) / 100);
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
  intra: parseSuite(
    await readFile(new URL("intra.jsonl", import.meta.url), "utf-8"),
  ),
  inter: parseSuite(
    await readFile(new URL("inter.jsonl", import.meta.url), "utf-8"),
  ),
});

//////////
// Main //
//////////

/**
 * @type {(
 *   suite: Suite,
 * ) => Size[]}
 */
const aggregateBrand = (suite) => {
  const sizes = [];
  for (const test_index of iterateTestIndex([suite])) {
    const test = getSuiteTest(suite, test_index);
    for (const branch_index of iterateBranchIndex([test])) {
      sizes.push(getTestSize(test, branch_index));
    }
  }
  return sizes;
};

/**
 * @type {(
 *   suite: Suite,
 * ) => number[]}
 */
const aggregateTest = (suite) => {
  const sizes = [];
  for (const test_index of iterateTestIndex([suite])) {
    const test = getSuiteTest(suite, test_index);
    sizes.push(sumTest(test));
  }
  return sizes;
};

const main = async () => {
  const suites = await loadSuiteRecord();
  verifySuiteRecord(suites);
  for (const name of stage_name_enum) {
    await writeFile(
      new URL(`${name}-aggregate.txt`, import.meta.url),
      aggregate(suites[name]).join("\n"),
      "utf8",
    );
  }

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

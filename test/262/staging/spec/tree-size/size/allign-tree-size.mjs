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
    const tests = suites.map((suite) => getSuiteTest(suite, test_index));
    for (const branch_index of iterateBranchIndex(tests)) {
      const hashes = tests.map((test) => getTestHash(test, branch_index));
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

///////////////
// Aggregate //
///////////////

/**
 * @type {(
 *   suite: Suite,
 * ) => Size[]}
 */
const aggregateBranch = (suite) => {
  /** @type {Size[]} */
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
 * ) => Size[]}
 */
const aggregateTest = (suite) => {
  /** @type {Size[]} */
  const sizes = [];
  for (const test_index of iterateTestIndex([suite])) {
    const test = getSuiteTest(suite, test_index);
    sizes.push(sumTest(test));
  }
  return sizes;
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
    const sum2 = sumTest(getSuiteTest(suite2, test_index));
    ratios.push(computeRatio(sum1, sum2));
  }
  return ratios;
};

//////////
// Main //
//////////

const main = async () => {
  const suites = await loadSuiteRecord();
  verifySuiteRecord(suites);
  for (const name of stage_name_enum) {
    await writeFile(
      new URL(`${name}-aggregate-branch.txt`, import.meta.url),
      aggregateBranch(suites[name]).join("\n"),
      "utf8",
    );
    await writeFile(
      new URL(`${name}-aggregate-test.txt`, import.meta.url),
      aggregateTest(suites[name]).join("\n"),
      "utf8",
    );
  }
  await writeFile(
    new URL("ratio-branch.txt", import.meta.url),
    ratioBranch(suites.intra, suites.inter).join("\n"),
    "utf8",
  );
  await writeFile(
    new URL("ratio-test.txt", import.meta.url),
    ratioTest(suites.intra, suites.inter).join("\n"),
    "utf8",
  );
};

await main();

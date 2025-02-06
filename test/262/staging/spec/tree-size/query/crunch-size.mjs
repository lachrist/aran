import { readFile, writeFile } from "node:fs/promises";
import { AranExecError } from "../../../../error.mjs";
import { isNotEmptyString } from "../../../../util/string.mjs";

const { Object, Math, URL, JSON, Array } = globalThis;

/**
 * @type {(
 *   value: unknown,
 * ) => value is 0}
 */
const isZero = (value) => value === 0;

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
 *   divident: number,
 *   divisor: number,
 * ) => number}
 */
const computeRatio = (divident, divisor) => {
  if (divident === 0 && divisor === 0) {
    return 0;
  }
  if (divident === 0) {
    throw new AranExecError("divident is zero", { divident, divisor });
  }
  if (divisor === 0) {
    throw new AranExecError("divisor is zero", { divident, divisor });
  }
  return Math.round((10000 * divident) / divisor) / 10000;
};

/**
 * @typedef {number & { __brand: "Hash" }} Hash
 * @typedef {number & { __brand: "Size" }} Size
 * @typedef {number & { __brand: "BranchIndex" }} BranchIndex
 * @typedef {Record<BranchIndex, Size | Hash> & { length: number }} Test
 * @typedef {import("../../../../test-case").TestIndex} TestIndex
 * @typedef {Record<TestIndex, Test> & { length: number }} Suite
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
 *   suites: Suite[],
 * ) => Iterable<TestIndex>}
 */
const iterateTestIndex = function* (suites) {
  const suite_length = getCommonLength(suites);
  for (let test_index = 0; test_index < suite_length; test_index++) {
    yield /** @type {TestIndex} */ (test_index);
  }
};

/**
 * @type {(
 *   tests: Test[],
 * ) => Iterable<BranchIndex>}
 */
const iterateBranchIndex = function* (tests) {
  const double_test_length = getCommonLength(tests);
  if (double_test_length % 2 !== 0) {
    throw new AranExecError("odd double test length", { double_test_length });
  }
  const test_length = double_test_length / 2;
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
        throw new AranExecError("hash mismatch", {
          hashes,
          test_index,
          branch_index,
        });
      }
      const sizes = tests.map((test) => getTestSize(test, branch_index));
      if (sizes.some(isZero) && !sizes.every(isZero)) {
        throw new AranExecError("zero mixture", {
          sizes,
          test_index,
          branch_index,
        });
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
  if (line === "") {
    return [];
  } else {
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
  }
};

/**
 * @type {(
 *   content: string,
 * ) => Suite}
 */
const parseSuite = (content) =>
  content.split("\n").filter(isNotEmptyString).map(parseTest);

/**
 * @type {(
 *   procedural: "inter" | "intra",
 * ) => URL}
 */
const locateStageOutput = (procedural) =>
  new URL(`../basic/stage-${procedural}-output.jsonl`, import.meta.url);

/**
 * @type {() => Promise<SuiteRecord>}
 */
const loadSuiteRecord = async () => ({
  intra: parseSuite(await readFile(locateStageOutput("intra"), "utf-8")),
  inter: parseSuite(await readFile(locateStageOutput("inter"), "utf-8")),
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
      new URL(`../output/${name}-aggregate-branch.txt`, import.meta.url),
      aggregateBranch(suites[name]).join("\n") + "\n",
      "utf8",
    );
    await writeFile(
      new URL(`../output/${name}-aggregate-test.txt`, import.meta.url),
      aggregateTest(suites[name]).join("\n") + "\n",
      "utf8",
    );
  }
  await writeFile(
    new URL("../output/ratio-branch.txt", import.meta.url),
    ratioBranch(suites.intra, suites.inter).join("\n") + "\n",
    "utf8",
  );
  await writeFile(
    new URL("../output/ratio-test.txt", import.meta.url),
    ratioTest(suites.intra, suites.inter).join("\n") + "\n",
    "utf8",
  );
};

await main();

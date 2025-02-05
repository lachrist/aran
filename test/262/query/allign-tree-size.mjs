import { readFile } from "node:fs/promises";
import { AranExecError } from "../error.mjs";
import { transpose } from "../util/array.mjs";
import { isNotEmptyString } from "../util/string.mjs";

const { URL, JSON, Array } = globalThis;

/**
 * @type {(
 *   arg0: unknown,
 *   arg1: number
 * ) => boolean}
 */
const isSecondEven = (_arg0, arg1) => arg1 % 2 === 0;

/**
 * @type {(
 *   line: string,
 * ) => number[]}
 */
const parseLine = (line) => {
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
 *   array: unknown[],
 * ) => boolean}
 */
const isRepeatArray = (array) => {
  const { length } = array;
  if (length === 0) {
    return true;
  } else {
    const base = array[0];
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
 *   lines: number[][]
 * ) => number[][]}
 */
const allignLine = (lines) => {
  const trans = transpose(lines);
  const { length } = trans;
  if (length % 2 !== 0) {
    throw new AranExecError("odd length", { length, trans });
  }
  for (let index = 0; index < length; index += 2) {
    if (!isRepeatArray(trans[index + 1])) {
      throw new AranExecError("hash mismatch", { index, trans });
    }
  }
  return trans.filter(isSecondEven);
};

/**
 * @type {(
 *   matrices: number[][][],
 * ) => number[][][]}
 */
export const allignMatrix = (matrices) => transpose(matrices).map(allignLine);

/**
 * @type {(
 *   content: string,
 * ) => number[][]}
 */
const loadMatrix = (content) =>
  content.split("\n").filter(isNotEmptyString).map(parseLine);

const main = async () => {
  console.log(
    JSON.stringify(
      allignMatrix([
        loadMatrix(
          await readFile(
            new URL("../staging/output/tree-size-intra.jsonl", import.meta.url),
            "utf-8",
          ),
        ),
        loadMatrix(
          await readFile(
            new URL("../staging/output/tree-size-inter.jsonl", import.meta.url),
            "utf-8",
          ),
        ),
      ]),
      null,
      2,
    ),
  );
};

await main();

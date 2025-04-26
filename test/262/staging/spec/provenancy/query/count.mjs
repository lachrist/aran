import { readFile } from "node:fs/promises";
import { parseBranching } from "../branching.mjs";
import { log } from "node:console";

const { Map, URL, Array } = globalThis;

/**
 * @type {(
 *   line: string,
 * ) => boolean}
 */
const isNotEmpty = (line) => line.length > 0;

/**
 * @type {<X>(
 *   item: {type: X},
 * ) => X}
 */
const getType = ({ type }) => type;

/**
 * @type {(
 *   entry1: [unknown, number],
 *   entry2: [unknown, number],
 * ) => number}
 */
const sortEntry = ([, value1], [, value2]) => value2 - value1;

/**
 * @type {<X>(
 *   array: {type: X}[],
 * ) => X[]}
 */
const getAllType = (array) => array.map(getType);

/**
 * @type {(
 *   include: "main" | "comp",
 * ) => Promise<string[][]>}
 */
const load = async (include) =>
  (
    await readFile(
      new URL(`../track/stack-${include}-output.jsonl`, import.meta.url),
      "utf8",
    )
  )
    .split("\n")
    .filter(isNotEmpty)
    .map(parseBranching)
    .map(getAllType);

const main = async () => {
  /** @type {Map<string, number>} */
  const partition = new Map();
  const suite = await load("main");
  for (const test of suite) {
    for (const item of test) {
      partition.set(item, (partition.get(item) ?? 0) + 1);
    }
  }
  for (const [key, val] of Array.from(partition.entries()).sort(sortEntry)) {
    log(`${key} & ${val}`);
  }
};

await main();

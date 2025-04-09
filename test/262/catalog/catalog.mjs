import { createInterface } from "node:readline";
import { packTestCase, unpackTestCase } from "../test-file/index.mjs";
import { open } from "node:fs/promises";

const { URL, Infinity, JSON } = globalThis;

const CATALOG = new URL("catalog.jsonl", import.meta.url);

/**
 * @type {(
 *   tests: AsyncIterable<import("../test-case.d.ts").TestCase>,
 * ) => Promise<void>}
 */
export const saveTestCase = async (tests) => {
  const handle = await open(CATALOG, "w");
  try {
    const stream = handle.createWriteStream({ encoding: "utf-8" });
    for await (const test of tests) {
      stream.write(JSON.stringify(packTestCase(test)) + "\n");
    }
  } finally {
    await handle.close();
  }
};

/**
 * @type {() => AsyncGenerator<[
 *   import("../test-case.d.ts").TestIndex,
 *   import("../test-case.d.ts").TestCase
 * ]>}
 */
export const loadTestCase = async function* () {
  const handle = await open(CATALOG, "r");
  try {
    const iterator = createInterface({
      input: handle.createReadStream(),
      crlfDelay: Infinity,
    });
    let index = 0;
    for await (const line of iterator) {
      yield [
        /** @type {import("../test-case.d.ts").TestIndex} */ (index),
        unpackTestCase(JSON.parse(line)),
      ];
      index++;
    }
  } finally {
    await handle.close();
  }
};

// /**
//  * @type {(
//  *   target: number,
//  * ) => Promise<import("../test-case.d.ts").TestCase>}
//  */
// export const grabTestCase = async (target) => {
//   const handle = await open(CATALOG, "r");
//   try {
//     const iterator = createInterface({
//       input: handle.createReadStream(),
//       crlfDelay: Infinity,
//     });
//     let index = 0;
//     for await (const line of iterator) {
//       if (index === target) {
//         return unpackTestCase(JSON.parse(line));
//       }
//       index++;
//     }
//     throw new AranExecError("index out of range", { target, index });
//   } finally {
//     await handle.close();
//   }
// };

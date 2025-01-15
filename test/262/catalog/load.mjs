/* eslint-disable local/no-function */

import { createInterface } from "node:readline";
import { unpackTestCase } from "../test-file/index.mjs";
import { CATALOG } from "./layout.mjs";
import { AranExecError } from "../error.mjs";
import { open } from "node:fs/promises";

const { Infinity, JSON } = globalThis;

/**
 * @type {() => AsyncIterable<import("../test-case").TestCase>}
 */
export const enumTestCase = async function* () {
  const handle = await open(CATALOG, "r");
  try {
    const iterator = createInterface({
      input: handle.createReadStream(),
      crlfDelay: Infinity,
    });
    for await (const line of iterator) {
      yield unpackTestCase(JSON.parse(line));
    }
  } finally {
    await handle.close();
  }
};

/**
 * @type {(
 *   index: number,
 * ) => Promise<import("../test-case").TestCase>}
 */
export const grabTestCase = async (index) => {
  const handle = await open(CATALOG, "r");
  try {
    let current = 0;
    const iterator = createInterface({
      input: handle.createReadStream(),
      crlfDelay: Infinity,
    });
    for await (const line of iterator) {
      if (current === index) {
        return unpackTestCase(JSON.parse(line));
      }
      current++;
    }
    throw new AranExecError("index out of range", { index, current });
  } finally {
    await handle.close();
  }
};

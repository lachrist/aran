/* eslint-disable local/no-function */

import { createInterface } from "node:readline";
import { createReadStream } from "node:fs";
import { unpackTestCase } from "../test-file/index.mjs";
import { CATALOG } from "./layout.mjs";
import { AranExecError } from "../error.mjs";

const { Infinity, JSON } = globalThis;

/**
 * @type {() => AsyncIterable<import("../test-case").TestCase>}
 */
export const enumTestCase = async function* () {
  const stream = createReadStream(CATALOG);
  try {
    const iterator = createInterface({
      input: stream,
      crlfDelay: Infinity,
    });
    for await (const line of iterator) {
      yield unpackTestCase(JSON.parse(line));
    }
  } finally {
    stream.close();
  }
};

/**
 * @type {(
 *   index: number,
 * ) => Promise<import("../test-case").TestCase>}
 */
export const grabTestCase = async (index) => {
  const stream = createReadStream(CATALOG);
  try {
    let current = 0;
    const iterator = createInterface({
      input: stream,
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
    stream.close();
  }
};

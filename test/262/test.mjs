import { readFile } from "node:fs/promises";
import { parseMetadata } from "./metadata.mjs";
import { runTestCase } from "./case.mjs";
import { inspectError } from "./util.mjs";

const { URL } = globalThis;

/**
 * @type {(
 *   options: {
 *     target: string,
 *     content: string,
 *     metadata: test262.Metadata,
 *     test262: URL,
 *   },
 * ) => test262.Case[]}
 */
const listTestCase = ({ target, content, metadata, test262 }) => {
  const asynchronous = metadata.flags.includes("async");
  const negative = metadata.negative;
  const includes = [
    ...(metadata.flags.includes("raw") ? [] : ["assert.js", "sta.js"]),
    ...(metadata.flags.includes("async") ? ["doneprintHandle.js"] : []),
    ...metadata.includes,
  ].map((name) => new URL(`harness/${name}`, test262));
  const module = metadata.flags.includes("module");
  /** @type {test262.Case[]} */
  const tests = [];
  if (
    !metadata.flags.includes("raw") &&
    !metadata.flags.includes("module") &&
    !metadata.flags.includes("noStrict")
  ) {
    tests.push({
      url: new URL(target, test262),
      content: `"use strict";\n${content}`,
      negative,
      asynchronous,
      includes,
      module,
    });
  }
  if (!metadata.flags.includes("onlyStrict")) {
    tests.push({
      url: new URL(target, test262),
      content,
      negative,
      asynchronous,
      includes,
      module,
    });
  }
  return tests;
};

/** @type {test262.Metadata} */
const DEFAULT_METADATA = {
  includes: [],
  flags: [],
  negative: null,
  locale: [],
  features: [],
};

/**
 * @type {(
 *   options: {
 *     target: string,
 *     test262: URL,
 *     instrumenter: test262.Instrumenter,
 *   },
 * ) => Promise<test262.Result>}
 */
export const runTest = async ({ target, test262, instrumenter }) => {
  const content = await readFile(new URL(target, test262), "utf8");
  /** @type {test262.Metadata} */
  let metadata = DEFAULT_METADATA;
  try {
    metadata = parseMetadata(content);
  } catch (error) {
    return {
      target,
      metadata,
      error: inspectError(error),
    };
  }
  for (const case_ of listTestCase({
    target,
    content,
    metadata,
    test262,
  })) {
    try {
      await runTestCase(case_, instrumenter);
    } catch (error) {
      return {
        target,
        metadata,
        error: inspectError(error),
      };
    }
  }
  return {
    target,
    metadata,
    error: null,
  };
};

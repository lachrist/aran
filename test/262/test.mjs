import { readFile } from "node:fs/promises";
import { parseMetadata } from "./metadata.mjs";
import { runTestCase } from "./case.mjs";
import { inspectError } from "./inspect.mjs";

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

/**
 * @type {(
 *   options: {
 *     target: string,
 *     test262: URL,
 *     makeInstrumenter: (trace: test262.Log[]) => test262.Instrumenter,
 *   },
 * ) => Promise<test262.Result>}
 */
export const runTest = async ({ target, test262, makeInstrumenter }) => {
  const content = await readFile(new URL(target, test262), "utf8");
  /** @type {test262.Metadata} */
  let metadata;
  try {
    metadata = parseMetadata(content);
  } catch (error) {
    return {
      target,
      features: [],
      trace: [],
      error: inspectError(error),
    };
  }
  for (const test of listTestCase({
    target,
    content,
    metadata,
    test262,
  })) {
    /** @type {test262.Log[]} */
    const trace = [];
    try {
      await runTestCase(test, trace, makeInstrumenter(trace));
    } catch (error) {
      return {
        target,
        features: metadata.features,
        trace,
        error: inspectError(error),
      };
    }
  }
  return {
    target,
    features: metadata.features,
    trace: [],
    error: null,
  };
};

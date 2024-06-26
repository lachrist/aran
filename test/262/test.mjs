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
  const kind = module ? "module" : "script";
  if (
    !metadata.flags.includes("raw") &&
    !metadata.flags.includes("module") &&
    !metadata.flags.includes("noStrict")
  ) {
    tests.push({
      source: {
        kind,
        url: new URL(target, test262),
        content: `"use strict";\n${content}`,
      },
      negative,
      asynchronous,
      includes,
    });
  }
  if (!metadata.flags.includes("onlyStrict")) {
    tests.push({
      source: {
        kind,
        url: new URL(target, test262),
        content,
      },
      negative,
      asynchronous,
      includes,
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
 *     compileInstrument: test262.CompileInstrument,
 *     warning: "ignore" | "console",
 *     record: import("./types").Instrument,
 *   },
 * ) => Promise<test262.Result>}
 */
export const runTest = async ({
  target,
  test262,
  warning,
  record,
  compileInstrument,
}) => {
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
      await runTestCase({ case: case_, compileInstrument, warning, record });
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

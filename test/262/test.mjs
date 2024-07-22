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
 *     metadata: import("./types").Metadata,
 *     home: URL,
 *   },
 * ) => import("./types").Case[]}
 */
const listTestCase = ({ target, content, metadata, home }) => {
  const asynchronous = metadata.flags.includes("async");
  const negative = metadata.negative;
  const includes = [
    ...(metadata.flags.includes("raw") ? [] : ["assert.js", "sta.js"]),
    ...(metadata.flags.includes("async") ? ["doneprintHandle.js"] : []),
    ...metadata.includes,
  ].map((name) => new URL(`harness/${name}`, home));
  const module = metadata.flags.includes("module");
  /** @type {import("./types").Case[]} */
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
        url: new URL(target, home),
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
        url: new URL(target, home),
        content,
      },
      negative,
      asynchronous,
      includes,
    });
  }
  return tests;
};

/** @type {import("./types").Metadata} */
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
 *     home: URL,
 *     compileInstrument: import("./types").CompileInstrument,
 *     warning: "ignore" | "console",
 *     record: import("./types").Instrument,
 *   },
 * ) => Promise<import("./types").Result>}
 */
export const runTest = async ({
  target,
  home,
  warning,
  record,
  compileInstrument,
}) => {
  const content = await readFile(new URL(target, home), "utf8");
  /** @type {import("./types").Metadata} */
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
    home,
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

/**
 * @type {(
 *   target: string,
 * ) => boolean}
 */
export const isTestCase = (target) =>
  !target.includes("_FIXTURE") && !target.endsWith(".md");

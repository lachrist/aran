import { readFile } from "node:fs/promises";
import { parseMetadata } from "./metadata.mjs";
import { runTestCase } from "./case.mjs";

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
      asynchronous,
      includes,
      module,
    });
  }
  if (!metadata.flags.includes("onlyStrict")) {
    tests.push({
      url: new URL(target, test262),
      content,
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
 *     instrumenter: test262.Instrumenter,
 *   },
 * ) => Promise<test262.Result>}
 */
export const runTest = async ({ target, test262, instrumenter }) => {
  const content = await readFile(new URL(target, test262), "utf8");
  const either = parseMetadata(content);
  switch (either.type) {
    case "failure":
      return { target, features: [], errors: [either.error] };
    case "success": {
      const metadata = either.value;
      /** @type {test262.Error[]} */
      const errors = [];
      for (const test of listTestCase({
        target,
        content,
        metadata,
        test262,
      })) {
        const exceptions = await runTestCase(test, instrumenter);
        if (metadata.negative === null) {
          errors.push(...exceptions);
        } else {
          if (exceptions.length === 0) {
            errors.push({ type: "negative" });
          } else if (
            exceptions.length !== 1 ||
            exceptions[0].type !== metadata.negative.phase ||
            exceptions[0].name !== metadata.negative.type
          ) {
            errors.push(...exceptions);
          }
        }
      }
      return {
        target,
        features: metadata.features,
        errors: errors,
      };
    }
  }
};

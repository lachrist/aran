import { readFile } from "node:fs/promises";
import { parseMetadata } from "./metadata.mjs";
import { runTestCase } from "./case.mjs";

const { URL } = globalThis;

/**
 * @type {(
 *   options: {
 *     relative: string,
 *     content: string,
 *     metadata: test262.Metadata,
 *     test262: URL,
 *   },
 * ) => test262.Case[]}
 */
const listTestCase = ({ relative, content, metadata, test262 }) => {
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
      url: new URL(relative, test262),
      content: `"use strict";\n${content}`,
      asynchronous,
      includes,
      module,
    });
  }
  if (!metadata.flags.includes("onlyStrict")) {
    tests.push({
      url: new URL(relative, test262),
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
 *     relative: string,
 *     test262: URL,
 *     instrumenter: test262.Instrumenter,
 *   },
 * ) => Promise<test262.Result>}
 */
export const runTest = async ({ relative, test262, instrumenter }) => {
  const content = await readFile(new URL(relative, test262), "utf8");
  const either = parseMetadata(content);
  switch (either.type) {
    case "failure":
      return { relative, features: [], errors: [either.error] };
    case "success": {
      const metadata = either.value;
      /** @type {test262.Error[]} */
      const errors = [];
      for (const test of listTestCase({
        relative,
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
        relative,
        features: metadata.features,
        errors: errors,
      };
    }
  }
};

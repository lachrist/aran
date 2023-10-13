import { readFile } from "node:fs/promises";
import { parseMetadata } from "./metadata.mjs";
import { runTestCase } from "./case.mjs";

const { URL } = globalThis;

/**
 * @type {(
 *   options: {
 *     relative: string,
 *     content: string,
 *     metadata: import("./types").Metadata,
 *     test262: URL,
 *   },
 * ) => import("./types").TestCase[]}
 */
const listTestCase = ({ relative, content, metadata, test262 }) => {
  const asynchronous = metadata.flags.includes("async");
  const includes = [
    ...(metadata.flags.includes("raw") ? [] : ["assert.js", "sta.js"]),
    ...(metadata.flags.includes("async") ? ["doneprintHandle.js"] : []),
    ...metadata.includes,
  ].map((name) => new URL(`harness/${name}`, test262));
  const module = metadata.flags.includes("module");
  /** @type {import("./types").TestCase[]} */
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
 *     instrument: (code: string, kind: "script" | "module") => string,
 *   },
 * ) => Promise<import("./types").TestError[]>}
 */
export const runTest = async ({ relative, test262, instrument }) => {
  const content = await readFile(new URL(relative, test262), "utf8");
  const either = parseMetadata(content);
  switch (either.type) {
    case "failure":
      return [either.error];
    case "success": {
      const metadata = either.value;
      /** @type {import("./types").TestError[]} */
      const errors = [];
      for (const test of listTestCase({
        relative,
        content,
        metadata,
        test262,
      })) {
        if (metadata.negative === null) {
          errors.push(...(await runTestCase(test, instrument)));
        } else {
          const failures = await runTestCase(test, instrument);
          if (failures.length === 0) {
            errors.push({ type: "negative" });
          } else if (
            failures.length !== 1 ||
            failures[0].type !== metadata.negative.phase ||
            failures[0].name !== metadata.negative.type
          ) {
            errors.push(...failures);
          }
        }
      }
      return errors;
    }
  }
};

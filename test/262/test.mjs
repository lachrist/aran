import { readFile } from "node:fs/promises";
import { parseMetadata } from "./metadata.mjs";
import { runTestCase } from "./case.mjs";

const { URL } = globalThis;

/**
 * @type {(
 *   options: {
 *     url: URL,
 *     content: string,
 *     metadata: import("./types").Metadata,
 *     root: URL,
 *   },
 * ) => import("./types").TestCase[]}
 */
const listTestCase = ({ url, content, metadata, root }) => {
  const asynchronous = metadata.flags.includes("async");
  const includes = [
    ...(metadata.flags.includes("raw") ? [] : ["assert.js", "sta.js"]),
    ...(metadata.flags.includes("async") ? ["doneprintHandle.js"] : []),
    ...metadata.includes,
  ].map((name) => new URL(`harness/${name}`, root));
  const module = metadata.flags.includes("module");
  /** @type {import("./types").TestCase[]} */
  const tests = [];
  // if (
  //   !metadata.flags.includes("raw") &&
  //   !metadata.flags.includes("module") &&
  //   !metadata.flags.includes("noStrict")
  // ) {
  //   tests.push({
  //     url,
  //     content: `"use strict";\n${content}`,
  //     asynchronous,
  //     includes,
  //     module,
  //   });
  // }
  if (!metadata.flags.includes("onlyStrict")) {
    tests.push({
      url,
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
 *   url: URL,
 *   root: URL,
 * ) => Promise<import("./types").TestError[]>}
 */
export const runTest = async (url, root) => {
  const content = await readFile(url, "utf8");
  const either = parseMetadata(content);
  switch (either.type) {
    case "failure":
      return [either.error];
    case "success": {
      const metadata = either.value;
      /** @type {import("./types").TestError[]} */
      const errors = [];
      for (const test of listTestCase({ url, content, metadata, root })) {
        if (metadata.negative === null) {
          errors.push(...(await runTestCase(test)));
        } else {
          const failures = await runTestCase(test);
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

import { parseMetadata } from "./metadata.mjs";
import { runTestCase } from "./test-case.mjs";

/**
 * @type {(
 *   path: import("./fetch").MainPath,
 *   content: string,
 *   metadata: import("./test262").Metadata,
 * ) => import("./test-case").TestCase[]}
 */
const listTestCase = (path, content, metadata) => {
  const asynchronous = metadata.flags.includes("async");
  const negative = metadata.negative;
  const includes = /** @type {import("./fetch").HarnessName[]} */ ([
    ...(metadata.flags.includes("raw") ? [] : ["assert.js", "sta.js"]),
    ...(metadata.flags.includes("async") ? ["doneprintHandle.js"] : []),
    ...metadata.includes,
  ]);
  const module = metadata.flags.includes("module");
  /** @type {import("./test-case").TestCase[]} */
  const test_case_array = [];
  const kind = module ? "module" : "script";
  if (
    !metadata.flags.includes("raw") &&
    !metadata.flags.includes("module") &&
    !metadata.flags.includes("noStrict")
  ) {
    test_case_array.push({
      directive: "use-strict",
      source: {
        type: "main",
        kind,
        path,
        content: `"use strict";\n${content}`,
      },
      negative,
      asynchronous,
      includes,
    });
  }
  if (!metadata.flags.includes("onlyStrict")) {
    test_case_array.push({
      directive: "none",
      source: {
        type: "main",
        kind,
        path,
        content,
      },
      negative,
      asynchronous,
      includes,
    });
  }
  return test_case_array;
};

/** @type {import("./test262").Metadata} */
const DEFAULT_METADATA = {
  includes: [],
  flags: [],
  negative: null,
  locale: [],
  features: [],
};

/**
 * @type {(
 *   path: import("./fetch").MainPath,
 *   dependencies: {
 *     fetchHarness: import("./fetch").FetchHarness,
 *     resolveDependency: import("./fetch").ResolveDependency,
 *     fetchTarget: import("./fetch").FetchTarget,
 *     setup: (context: import("node:vm").Context) => void,
 *     instrument: import("./stage").Instrument,
 *   },
 * ) => Promise<{
 *   metadata: import("./test262").Metadata,
 *   result: import("./result").Result,
 * }>}
 */
export const execTest = async (
  path,
  { fetchTarget, resolveDependency, fetchHarness, setup, instrument },
) => {
  const content = await fetchTarget(path);
  const metadata_outcome = parseMetadata(content);
  if (metadata_outcome.type === "failure") {
    return {
      metadata: DEFAULT_METADATA,
      result: { type: "exclude", data: ["metadata"] },
    };
  }
  const metadata = metadata_outcome.data;
  /**
   * @type {import("./result").Execution[]}
   */
  const executions = [];
  for (const test_case of listTestCase(path, content, metadata)) {
    const { expect, actual, time } = await runTestCase(test_case, {
      resolveDependency,
      fetchTarget,
      fetchHarness,
      setup,
      instrument,
    });
    executions.push({
      directive: test_case.directive,
      expect,
      actual,
      time,
    });
  }
  return { metadata, result: { type: "include", data: executions } };
};

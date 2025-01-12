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
 *   outcome: import("./test-case").TestCaseOutcome,
 * }>}
 */
export const runTest = async (
  path,
  { fetchTarget, resolveDependency, fetchHarness, setup, instrument },
) => {
  const content = await fetchTarget(path);
  const metadata_outcome = parseMetadata(content);
  if (metadata_outcome.type === "failure") {
    return {
      metadata: DEFAULT_METADATA,
      outcome: metadata_outcome,
    };
  }
  const metadata = metadata_outcome.data;
  for (const test_case of listTestCase(path, content, metadata)) {
    const test_case_outcome = await runTestCase(test_case, {
      resolveDependency,
      fetchTarget,
      fetchHarness,
      setup,
      instrument,
    });
    if (test_case_outcome.type === "failure") {
      return {
        metadata,
        outcome: test_case_outcome,
      };
    }
  }
  return {
    metadata,
    outcome: { type: "success", data: null },
  };
};

import { parseMetadata } from "./metadata.mjs";
import { toTestSpecifier } from "./result.mjs";
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

/**
 * @type {<X>(
 *   array: X[]
 * ) => array is [X, ...X[]]}
 */
const isNotEmptyArray = (array) => array.length > 0;

/**
 * @type {(
 *   path: import("./fetch").MainPath,
 *   exclude: (
 *     specifier: import("./result").TestSpecifier,
 *   ) => string[],
 *   dependencies: {
 *     fetchHarness: import("./fetch").FetchHarness,
 *     resolveDependency: import("./fetch").ResolveDependency,
 *     fetchTarget: import("./fetch").FetchTarget,
 *     setup: (context: import("node:vm").Context) => void,
 *     instrument: import("./stage").Instrument,
 *   },
 * ) => Promise<{
 *   metadata: import("./test262").Metadata,
 *   entries: import("./result").ResultEntry[],
 * }>}
 */
export const execTest = async (
  path,
  exclude,
  { fetchTarget, resolveDependency, fetchHarness, setup, instrument },
) => {
  const content = await fetchTarget(path);
  const metadata = parseMetadata(content);
  /**
   * @type {import("./result").ResultEntry[]}
   */
  const entries = [];
  for (const test_case of listTestCase(path, content, metadata)) {
    const specifier = toTestSpecifier(path, test_case.directive);
    const exclusion = exclude(specifier);
    entries.push([
      specifier,
      isNotEmptyArray(exclusion)
        ? exclusion
        : await runTestCase(test_case, {
            resolveDependency,
            fetchTarget,
            fetchHarness,
            setup,
            instrument,
          }),
    ]);
  }
  return { metadata, entries };
};

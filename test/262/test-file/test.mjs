import { parseMetadata } from "./metadata.mjs";
import { stderr } from "node:process";
import { inspectErrorMessage, inspectErrorName } from "../util/index.mjs";

/** @type {import("../fetch").HarnessName[]} */
const NOT_RAW_HARNESS_NAME_ARRAY = ["assert.js", "sta.js"];

/** @type {import("../fetch").HarnessName[]} */
const ASYNC_HARNESS_NAME_ARRAY = ["doneprintHandle.js"];

/**
 * @type {(
 *   path: import("../fetch").TestPath,
 *   content: string,
 *   metadata: import("../metadata").Metadata,
 * ) => import("../test-case").TestCase[]}
 */
const listTestCase = (path, content, metadata) => {
  const asynchronous = metadata.flags.includes("async");
  const negative = metadata.negative;
  /** @type {import("../fetch").HarnessName[]} */
  const includes = [
    ...(metadata.flags.includes("raw") ? [] : NOT_RAW_HARNESS_NAME_ARRAY),
    ...(metadata.flags.includes("async") ? ASYNC_HARNESS_NAME_ARRAY : []),
    ...metadata.includes,
  ];
  const module = metadata.flags.includes("module");
  /** @type {import("../test-case").TestCase[]} */
  const test_case_array = [];
  const kind = module ? "module" : "script";
  if (
    !metadata.flags.includes("raw") &&
    !metadata.flags.includes("module") &&
    !metadata.flags.includes("noStrict")
  ) {
    test_case_array.push({
      features: metadata.features,
      directive: "use-strict",
      kind,
      path,
      content: `"use strict";\n${content}`,
      negative,
      asynchronous,
      includes,
    });
  }
  if (!metadata.flags.includes("onlyStrict")) {
    test_case_array.push({
      features: metadata.features,
      directive: "none",
      kind,
      path,
      content,
      negative,
      asynchronous,
      includes,
    });
  }
  return test_case_array;
};

/**
 * @type {(
 *   file: {
 *     path: import("../fetch").TestPath,
 *     content: string,
 *   },
 * ) => import("../test-case").TestCase[]}
 */
export const parseTestFile = ({ path, content }) => {
  let metadata;
  try {
    metadata = parseMetadata(content);
  } catch (error) {
    stderr.write(
      `cannot parse metadata of ${path} >> ${inspectErrorName(error)} >> ${inspectErrorMessage(error)}\n`,
    );
    return [];
  }
  return listTestCase(path, content, metadata);
};

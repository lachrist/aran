import { parseMetadata } from "./metadata.mjs";
import { stderr } from "node:process";
import { inspectErrorMessage, inspectErrorName } from "./error-serial.mjs";

/**
 * @type {(
 *   path: import("./fetch").TestPath,
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
      metadata,
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
      metadata,
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
 * @type {(
 *   file: {
 *     path: import("./fetch").TestPath,
 *     content: string,
 *   },
 * ) => import("./test-case").TestCase[]}
 */
export const parseTest = ({ path, content }) => {
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

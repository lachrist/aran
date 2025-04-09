import { readFile } from "node:fs/promises";

const { URL } = globalThis;

/**
 * @type {(
 *   octane: import("./enum.d.ts").OctaneBase,
 * ) => string[]}
 */
const listOctaneFile = (octane) => {
  if (octane === "typescript") {
    return ["typescript-compiler", "typescript-input", "typescript"];
  }
  if (octane === "zlib") {
    return ["zlib-data", "zlib"];
  }
  if (octane === "gbemu") {
    return ["gbemu-part1", "gbemu-part2"];
  }
  return [octane];
};

/**
 * @type {(
 *   octane: import("./enum.d.ts").OctaneBase,
 * ) => Promise<string>}
 */
export const bundleOctane = async (octane) => {
  let bundle = "";
  bundle += await readFile(new URL("octane/base.js", import.meta.url), "utf8");
  bundle += "\n\n\n";
  for (const file of listOctaneFile(octane)) {
    bundle += await readFile(
      new URL(`octane/${file}.js`, import.meta.url),
      "utf8",
    );
    bundle += "\n\n\n";
  }
  bundle += `
    BenchmarkSuite.RunSuites({
      NotifyStart: (...args) => {
        console.log("NotifyStart", args);
      },
      NotifyError: (...args) => {
        console.log("NotifyError", args);
      },
      NotifyResult: (...args) => {
        console.log("NotifyResult", args);
      },
      NotifyScore: (...args) => {
        console.log("NotifyScore", args);
      },
      NotifyStep: (...args) => {
        console.log("NotifyStep", args);
      },
    });
    for (const suite of BenchmarkSuite.suites) {
      for (const result of suite.results) {
        console.dir(result, { depth: 1 / 0 });
      }
    }
  `;
  return bundle;
};

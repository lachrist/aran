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
      NotifyStart: (name) => {
        console.log("Start", name);
      },
      NotifyError: (name, error) => {
        console.log("Error", name, error);
      },
      NotifyResult: (name, score) => {
        console.log("Score", name, score);
      },
      NotifyScore: (...args) => {
        // console.log("NotifyScore", args);
      },
      NotifyStep: (name) => {
        console.log("Step", name);
      },
    });
    for (const { results } of BenchmarkSuite.suites) {
      for (const { benchmark: { name }, time, latency } of results) {
        console.log("Final", name, time / 1000, latency);
      }
    }
  `;
  return bundle;
};

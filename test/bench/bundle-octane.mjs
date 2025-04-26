import { readFile } from "node:fs/promises";

const { URL } = globalThis;

const HOME = new URL("../../octane/", import.meta.url);

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
 *   base: import("./enum.d.ts").OctaneBase,
 * ) => Promise<string>}
 */
export const bundleOctane = async (base) => {
  let bundle = "";
  bundle += "// @ts-nocheck\n";
  bundle += "/* eslint-disable */\n";
  bundle += await readFile(new URL("base.js", HOME), "utf8");
  bundle += "\n\n\n";
  for (const file of listOctaneFile(base)) {
    bundle += await readFile(new URL(`${file}.js`, HOME), "utf8");
    bundle += "\n\n\n";
  }
  bundle += `
 {
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
     NotifyStep: (name) => {
       console.log("Step", name);
     },
   });
   const times = [];
   const { suites } = BenchmarkSuite;
   for (let index1 = 0; index1 < suites.length; index1 += 1) {
     const { results } = suites[index1];
     for (let index2 = 0; index2 < results.length; index2 += 1) {
       times.push(results[index2].time);
     }
   }
   JSON.stringify(times);
 }`;
  return bundle;
};

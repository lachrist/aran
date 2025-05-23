import { stat, readFile } from "fs/promises";
import { log } from "node:console";
import { isMeta, octane_base_enum } from "./enum.mjs";
import { toBasePath, toDumpPath, toMainPath } from "./layout.mjs";
import { spawn } from "./spawn.mjs";
import { argv } from "node:process";

const {
  Error,
  Array: { isArray },
  JSON,
  Math,
} = globalThis;

/**
 * @typedef {{
 *   meta: import("./enum.d.ts").Meta,
 *   base: import("./enum.d.ts").OctaneBase,
 *   time: number[] | null,
 *   size: number | null,
 *   status: number | null,
 *   signal: string | null,
 * }} Result
 */

/**
 * @type {import("./enum.d.ts").Meta[]}
 */
const meta_enum = [
  // "none",
  // "bare",
  // "linvail/custom/external",
  // "linvail/custom/internal",
  // "linvail/standard/external",
  // "linvail/standard/internal",
  // "symbolic/intensional/void",
  // "symbolic/intensional/file",
  "symbolic/extensional/void",
];

/**
 * @type {(x: number) => number}
 */
const devide1000 = (x) => x / 1000;

/**
 * @type {(
 *   meta: import("./enum.d.ts").Meta,
 *   base: import("./enum.d.ts").OctaneBase,
 * ) => Promise<number[]>}
 */
const readTime = async (meta, base) => {
  const path = toDumpPath(meta, base);
  const content = await readFile(path, "utf8");
  /** @type {unknown} */
  const time = JSON.parse(content);
  if (!isArray(time)) {
    throw new Error("not array");
  }
  for (const item of time) {
    if (typeof item !== "number") {
      throw new Error("not number");
    }
  }
  return time.map(devide1000);
};

/**
 * @type {(
 *   meta: import("./enum.d.ts").Meta,
 *   base: import("./enum.d.ts").OctaneBase,
 * ) => Promise<number[] | null>}
 */
const readTimeMaybe = async (meta, base) => {
  try {
    return await readTime(meta, base);
  } catch (error) {
    log(error);
    return null;
  }
};

/**
 * @type {(
 *   meta: import("./enum.d.ts").Meta,
 *   base: import("./enum.d.ts").OctaneBase,
 * ) => Promise<Result>}
 */
const exec = async (meta, base) => {
  log(`\nEXEC ${meta} ${base}...`);
  {
    const { status, signal } = await spawn("node", [
      "--max-old-space-size=8192",
      "test/bench/comp.mjs",
      meta,
      base,
    ]);
    if (status !== 0 || signal !== null) {
      return { status, signal, meta, base, time: null, size: null };
    }
  }
  const { status, signal } = await spawn("node", [
    "--max-old-space-size=8192",
    "--max-semi-space-size=256",
    toMainPath(meta, base),
  ]);
  const size = Math.round((await stat(toBasePath(meta, base, 2))).size / 1024);
  const time = await readTimeMaybe(meta, base);
  return { status, signal, meta, base, time, size };
};

/**
 * @type {(
 *   argv: string[],
 * ) => Promise<void>}
 */
const main = async (argv) => {
  if (!argv.every(isMeta)) {
    throw new Error("not all argv are analyses", { cause: { argv } });
  }
  /** @type {Result[]} */
  const results = [];
  for (const base of octane_base_enum) {
    if (
      base === "navier-stokes" ||
      base === "raytrace" ||
      base === "regexp" ||
      base === "richards" ||
      base === "splay" ||
      base === "box2d" ||
      base === "code-load" ||
      base === "crypto" ||
      base === "deltablue" ||
      base === "earley-boyer" ||
      base === "gbemu" || // slow
      base === "typescript" || // slow
      base === "zlib"
    ) {
      continue;
    }
    for (const meta of argv.length === 0 ? meta_enum : argv) {
      const result = await exec(meta, base);
      log(result);
      results.push(result);
    }
  }
  log(JSON.stringify(results, null, 2));
};

await main(argv.slice(2));

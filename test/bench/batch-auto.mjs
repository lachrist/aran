import { stat, readFile, writeFile } from "node:fs/promises";
import { log } from "node:console";
import { argv } from "node:process";
import { AUTO_BASE_ENUM, isAutoBase } from "./enum.mjs";
import { toBasePath, toMainPath } from "./layout.mjs";
import { spawn } from "./spawn.mjs";
import { time_location } from "./base/auto-time.mjs";

const { Error, URL, JSON, Math } = globalThis;

/**
 * @typedef {{
 *   meta: import("./enum.js").Meta,
 *   base: import("./enum.js").AutoBase,
 *   time: number[] | null,
 *   size: number | null,
 *   status: number | null,
 *   signal: string | null,
 * }} Result
 */

/**
 * @type {import("./enum.js").Meta[]}
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
  // "symbolic/extensional/void",
  "provenancy/stack",
  "provenancy/intra",
  "provenancy/inter",
  "provenancy/store/external",
  "provenancy/store/internal",
];

/**
 * @type {() => Promise<number[] | null>}
 */
const loadTime = async () => {
  try {
    return JSON.parse(await readFile(time_location, "utf8"));
  } catch (error) {
    log(error);
    return null;
  }
};

/**
 * @type {(
 *   meta: import("./enum.js").Meta,
 *   base: import("./enum.js").AutoBase,
 * ) => Promise<number | null>}
 */
const loadSize = async (meta, base) => {
  try {
    return Math.round((await stat(toBasePath(meta, base, 2))).size / 1024);
  } catch (error) {
    log(error);
    return null;
  }
};

/**
 * @type {(
 *   meta: import("./enum.js").Meta,
 *   base: import("./enum.js").AutoBase,
 * ) => Promise<Result>}
 */
const exec = async (meta, base) => {
  log(`\nRun ${meta} ${base}...`);
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
  const size = await loadSize(meta, base);
  const time = await loadTime();
  return { status, signal, meta, base, time, size };
};

/**
 * @type {(
 *   argv: string[],
 * ) => Promise<void>}
 */
const main = async (argv) => {
  if (!argv.every(isAutoBase)) {
    throw new Error("not all argv are auto target", { cause: { argv } });
  }
  /** @type {Result[]} */
  const results = [];
  for (const base of argv.length === 0 ? AUTO_BASE_ENUM : argv) {
    for (const meta of meta_enum) {
      const result = await exec(meta, base);
      log(result);
      results.push(result);
    }
  }
  await writeFile(
    new URL("batch-auto.json", import.meta.url),
    JSON.stringify(results, null, 2),
    "utf8",
  );
};

await main(argv.slice(2));

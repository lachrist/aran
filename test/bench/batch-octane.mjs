import { stat, readFile } from "fs/promises";
import { log } from "node:console";
import { OCTANE_BASE_ENUM } from "./enum.mjs";
import { toBasePath, toDumpPath, toMainPath } from "./layout.mjs";
import { spawn } from "./spawn.mjs";
import { argv } from "node:process";

const { JSON, Math } = globalThis;

/**
 * @typedef {{
 *   meta: import("./enum.js").Meta,
 *   base: import("./enum.js").OctaneBase,
 *   time: number[],
 *   size: number,
 * }} Result
 */

/**
 * @type {import("./enum.js").Meta[]}
 */
const metas = [
  // "none",
  // "bare",
  // "linvail/custom/external",
  // "linvail/custom/internal",
  // "linvail/standard/external",
  // "linvail/standard/internal",
  "symbolic/intensional/void",
  "symbolic/intensional/file",
];

/**
 * @type {(x: number) => number}
 */
const devide1000 = (x) => x / 1000;

/**
 * @type {(
 *   meta: import("./enum.js").Meta,
 *   base: import("./enum.js").OctaneBase,
 * ) => Promise<Result>}
 */
const exec = async (meta, base) => {
  log(`\nEXEC ${meta} ${base}...`);
  await spawn("node", [
    "--max-old-space-size=8192",
    "test/bench/comp.mjs",
    meta,
    base,
  ]);
  const base_path = toBasePath(meta, base, 2);
  const dump_path = toDumpPath(meta, base);
  const main_path = toMainPath(meta, base);
  await spawn("node", [
    "--max-old-space-size=8192",
    "--max-semi-space-size=256",
    main_path,
  ]);
  const size = Math.round((await stat(base_path)).size / 1024);
  const time = await readFile(dump_path, "utf8");
  return { meta, base, time: JSON.parse(time).map(devide1000), size };
};

/**
 * @type {(
 *   argv: string[],
 * ) => Promise<void>}
 */
const main = async (_argv) => {
  /** @type {Result[]} */
  const results = [];
  for (const base of OCTANE_BASE_ENUM) {
    for (const meta of metas) {
      const result = await exec(meta, base);
      log(result);
      results.push(result);
    }
  }
  log(JSON.stringify(results, null, 2));
};

await main(argv.slice(2));

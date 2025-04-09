import { open } from "node:fs/promises";
import { loadTestCase } from "../catalog/catalog.mjs";
import { loadStageResult } from "../staging/result.mjs";
import { toTestSpecifier } from "../result.mjs";
import { stdout } from "node:process";

const { URL, Map, Math, JSON } = globalThis;

const precision = 1e3;

/**
 * @type {(
 *   above: number,
 *   below: number,
 * ) => number}
 */
const ratio = (above, below) =>
  Math.round(1e2 * precision * (above / (below + above))) / precision;

/**
 * @type {(
 *   threshold: number,
 * ) => Promise<{
 *   threshold: number,
 *   total_count: number,
 *   below_count: number,
 *   above_count: number,
 *   ratio_count: number,
 *   total_time: number,
 *   above_time: number,
 *   below_time: number,
 *   ratio_time: number,
 * }>}`
 */
const main = async (threshold) => {
  const handle = await open(
    new URL("../tagging/data/slow.txt", import.meta.url),
    "w",
  );
  const stream = handle.createWriteStream({ encoding: "utf-8" });
  try {
    let below_time = 0;
    let above_time = 0;
    let below_count = 0;
    let above_count = 0;
    /**
     * @type {Map<
     *   import("../test-case.d.ts").TestIndex,
     *   import("../result.d.ts").TestSpecifier
     * >}
     */
    const catalog = new Map();
    for await (const [index, { path, directive }] of loadTestCase()) {
      catalog.set(index, toTestSpecifier(path, directive));
    }
    for await (const [index, result] of loadStageResult("identity")) {
      if (result.type === "include") {
        const time = result.time.user + result.time.system;
        if (time > threshold) {
          stream.write(catalog.get(index) + "\n");
          above_count++;
          above_time += time;
        } else {
          below_count++;
          below_time += time;
        }
      }
    }
    return {
      threshold,
      total_count: below_count + above_count,
      below_count,
      above_count,
      ratio_count: ratio(below_count, above_count),
      total_time: below_time + above_time,
      above_time,
      below_time,
      ratio_time: ratio(below_time, above_time),
    };
  } finally {
    await handle.close();
  }
};

// 65536
stdout.write(JSON.stringify(await main(2 ** 16), null, 2) + "\n");

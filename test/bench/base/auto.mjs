import { log } from "node:console";
import { performance } from "node:perf_hooks";
import { writeFile } from "node:fs/promises";
import { parse } from "acorn";
import { generate } from "astring";
import { transpile, retropile } from "aran";
import { time_location } from "./auto-time.mjs";

const { Math, JSON } = globalThis;

/**
 * @type {(
 *   code: string,
 *   kind: "module" | "script",
 *   repetition: number,
 * ) => number[]}
 */
const benchmark = (code, kind, repetition) => {
  const times = [];
  for (let index = 1; index <= repetition; index++) {
    log("Run", index, "/", repetition, "...");
    const start = performance.now();
    const root = generate(
      retropile(
        transpile({
          kind,
          path: "main",
          root: parse(code, { sourceType: kind, ecmaVersion: 2024 }),
        }),
      ),
    );
    const end = performance.now();
    const elapsed = Math.round(1000 * (end - start)) / 1000;
    log("Elapsed:", elapsed, "ms", ">>", "Output:", root.length);
    times.push(elapsed);
  }
  return times;
};

/**
 * @type {(
 *   code: string,
 *   kind: "module" | "script",
 *   repetition: number,
 * ) => Promise<void>}
 */
export const main = async (code, kind, repetition) => {
  await writeFile(
    time_location,
    JSON.stringify(benchmark(code, kind, repetition)),
    "utf8",
  );
};

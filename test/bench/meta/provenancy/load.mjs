import { readFile } from "node:fs/promises";
import { printExecName } from "./naming.mjs";
import { parseBranch } from "./branch.mjs";
import { trace_home } from "./layout.mjs";

const { URL } = globalThis;

/**
 * @type {(
 *   line: string,
 * ) => boolean}
 */
const isNotEmpty = (x) => x !== "";

/**
 * @type {(
 *   test: {
 *     meta: import("../../enum.d.ts").Meta,
 *     base: import("../../enum.d.ts").Base,
 *   },
 * ) => Promise<import("./branch.d.ts").Branch[]>}
 */
export const loadTrace = async (test) =>
  (await readFile(new URL(`${printExecName(test)}.txt`, trace_home), "utf8"))
    .split("\n")
    .filter(isNotEmpty)
    .map(parseBranch);

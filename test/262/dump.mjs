import { readFile } from "node:fs/promises";
import { parseResultDump, isFailure, getTarget } from "./result.mjs";

const { URL } = globalThis;

/**
 * @type {(
 *   stage: string,
 * ) => Promise<string[]>}
 */
export const listStageFailure = async (stage) =>
  parseResultDump(
    await readFile(
      new URL(`stages/${stage}.jsonlist`, import.meta.url),
      "utf8",
    ),
  )
    .filter(isFailure)
    .map(getTarget);

// console.log(JSON.stringify(await listStageFailure("empty-enclave")));

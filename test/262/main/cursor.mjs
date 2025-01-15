import { readFile, writeFile } from "node:fs/promises";
import { AranExecError } from "../error.mjs";
import { CURSOR } from "./layout.mjs";

const { parseInt } = globalThis;

/**
 * @type {() => Promise<number>}
 */
export const loadCursor = async () => {
  let content;
  try {
    content = (await readFile(CURSOR, "utf-8")).trim();
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return 0;
    } else {
      throw error;
    }
  }
  if (content === "") {
    return 0;
  } else if (/^\d+$/.test(content)) {
    return parseInt(content);
  } else {
    throw new AranExecError("Invalid cursor content", { content });
  }
};

/**
 * @type {(
 *   cursor: number,
 * ) => Promise<void>}
 */
export const saveCursor = async (cursor) => {
  await writeFile(CURSOR, `${cursor}\n`, "utf-8");
};

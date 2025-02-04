import { readFile, writeFile } from "node:fs/promises";
import { AranExecError } from "../error.mjs";

const { URL, parseInt } = globalThis;

const CURSOR = new URL("cursor.txt", import.meta.url);

/**
 * @type {() => Promise<number>}
 */
export const loadCursor = async () => {
  let content;
  try {
    content = await readFile(CURSOR, "utf-8");
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
  const lines = content.split("\n");
  if (lines.length === 0) {
    return 0;
  } else {
    const head = lines[0].trim();
    if (head === "") {
      return 0;
    } else if (/^\d+$/.test(head)) {
      return parseInt(head);
    } else {
      throw new AranExecError("Invalid cursor content", { content });
    }
  }
};

/**
 * @type {(
 *   cursor: number,
 *   specifier: null | import("../result").TestSpecifier,
 * ) => Promise<void>}
 */
export const saveCursor = async (cursor, specifier) => {
  await writeFile(
    CURSOR,
    specifier === null ? `${cursor}\n` : `${cursor}\n${specifier}\n`,
    "utf-8",
  );
};

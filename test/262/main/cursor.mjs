import { readFile, writeFile } from "node:fs/promises";
import { AranExecError } from "../error.mjs";

const { JSON, URL, parseInt } = globalThis;

const CURSOR = new URL("cursor.txt", import.meta.url);

/**
 * @type {() => Promise<import("../test-case.d.ts").TestIndex>}
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
      return /** @type {import("../test-case.d.ts").TestIndex} */ (0);
    } else {
      throw error;
    }
  }
  const lines = content.split("\n");
  if (lines.length === 0) {
    return /** @type {import("../test-case.d.ts").TestIndex} */ (0);
  } else {
    const head = lines[0].trim();
    if (head === "") {
      return /** @type {import("../test-case.d.ts").TestIndex} */ (0);
    } else if (/^\d+$/.test(head)) {
      return /** @type {import("../test-case.d.ts").TestIndex} */ (
        parseInt(head)
      );
    } else {
      throw new AranExecError("Invalid cursor content", { content });
    }
  }
};

/**
 * @type {(
 *   cursor: number,
 *   test: null | import("../test-case.d.ts").TestCase,
 * ) => Promise<void>}
 */
export const saveCursor = async (cursor, test) => {
  await writeFile(
    CURSOR,
    test === null ? `${cursor}\n` : `${cursor}\n${JSON.stringify(test)}\n`,
    "utf-8",
  );
};

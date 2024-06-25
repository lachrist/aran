import { parseList } from "./list.mjs";

const {
  isNaN,
  parseInt,
  Error,
  Object: { hasOwn },
} = globalThis;

/**
 * @type {{ [key in import("./cursor").Stage]: null }}
 */
const STAGES = {
  identity: null,
  parsing: null,
};

/**
 * @type {(
 *   candidate: string
 * ) => candidate is import("./cursor").Stage}
 */
const isStage = (candidate) => hasOwn(STAGES, candidate);

/**
 * @type {(
 *   line: string
 * ) => import("./cursor").Stage}
 */
const parseStage = (line) => {
  if (isStage(line)) {
    return line;
  } else {
    throw new Error("Invalid stage");
  }
};

/**
 * @type {(
 *   line: string
 * ) => number}
 */
const parseIndex = (line) => {
  const index = parseInt(line);
  if (isNaN(index)) {
    throw new Error("Invalid index");
  } else {
    return index;
  }
};

/**
 * @type {(
 *   content: string,
 * ) => import("./cursor").Cursor}
 */
export const parseCursor = (content) => {
  const lines = parseList(content);
  if (lines.length !== 2) {
    throw new Error("Cursor file should have exactly two lines");
  } else {
    return {
      stage: parseStage(lines[0]),
      index: parseIndex(lines[1]),
    };
  }
};

/**
 * @type {(
 *   cursor: import("./cursor").Cursor,
 * ) => string}
 */
export const stringifyCursor = (cursor) => `${cursor.stage}\n${cursor.index}\n`;

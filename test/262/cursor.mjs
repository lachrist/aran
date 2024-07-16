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
  "identity": null,
  "parsing": null,
  "empty-standard-native": null,
  "empty-standard-emulate": null,
  "transparent-standard-emulate": null,
  "transparent-standard-native": null,
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
  if (lines.length === 0) {
    throw new Error("Empty cursor file");
  } else {
    const stage = parseStage(lines[0]);
    if (lines.length === 1) {
      return {
        stage,
        index: 0,
        target: null,
      };
    } else if (lines.length === 2) {
      try {
        return {
          stage,
          index: parseIndex(lines[1]),
          target: null,
        };
      } catch {
        return {
          stage,
          index: null,
          target: lines[1],
        };
      }
    } else if (lines.length === 3) {
      return {
        stage,
        index: parseIndex(lines[1]),
        target: lines[2],
      };
    } else {
      throw new Error("Cursor file should have at most three lines");
    }
  }
};

/**
 * @type {(
 *   cursor: import("./cursor").Cursor,
 * ) => string}
 */
export const stringifyCursor = (cursor) =>
  `${cursor.stage}\n${cursor.index === null ? "" : `${cursor.index}\n`}${
    cursor.target === null ? "" : `${cursor.target}\n`
  }`;

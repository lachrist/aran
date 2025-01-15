import { AranExecError } from "./error.mjs";
import { isStageName } from "./staging/index.mjs";
import { isNotEmptyString, trimString } from "./util/index.mjs";

const { parseInt } = globalThis;

/**
 * @type {(
 *   line: string
 * ) => import("./staging/stage-name").StageName}
 */
const parseStageLine = (line) => {
  if (isStageName(line)) {
    return line;
  } else {
    throw new AranExecError("Invalid stage line", { line });
  }
};

/**
 * @type {(
 *   line: string
 * ) => {
 *   index: number | null,
 *   path: import("./fetch").TestPath | null,
 * }}
 */
const parseTargetLine = (line) => {
  const match = line.match(/^\s*(\d*)\s*(.*)\s*$/u);
  if (match === null) {
    throw new AranExecError("Invalid target line", { line });
  } else {
    return {
      index: match[1] === "" ? null : parseInt(match[1]),
      path:
        match[2] === ""
          ? null
          : /** @type {import("./fetch").TestPath} */ (match[2]),
    };
  }
};

/**
 * @type {(
 *   content: string,
 * ) => import("./cursor").Cursor}
 */
export const parseCursor = (content) => {
  const lines = content.split("\n").map(trimString).filter(isNotEmptyString);
  if (lines.length === 0) {
    throw new AranExecError("Empty cursor file", { content });
  } else if (lines.length === 1) {
    return {
      stage: parseStageLine(lines[0]),
      ...{ index: 0, path: null },
    };
  } else if (lines.length === 2) {
    return {
      stage: parseStageLine(lines[0]),
      ...parseTargetLine(lines[1]),
    };
  } else {
    throw new AranExecError("Cursor file should have at most two lines", {
      content,
    });
  }
};

/**
 * @type {(
 *   cursor: import("./cursor").Cursor,
 * ) => string}
 */
export const stringifyCursor = (cursor) => {
  if (cursor.index === null && cursor.path === null) {
    return `${cursor.stage}\n`;
  } else {
    return `${cursor.stage}\n${
      cursor.index === null ? "" : `${cursor.index} `
    }${cursor.path === null ? "" : cursor.path}\n`;
  }
};

import { AranExecError } from "../error.mjs";
import { isStageName } from "../staging/index.mjs";
import { isNotEmptyString, trimString } from "../util/index.mjs";

const { parseInt } = globalThis;

/**
 * @type {(
 *   line: string
 * ) => import("../staging/stage-name").StageName}
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
 * ) => number}
 */
const parseIndexLine = (line) => {
  if (/^\d+$/.test(line)) {
    return parseInt(line);
  } else {
    throw new AranExecError("Invalid index line", { line });
  }
};

/**
 * @type {(
 *   content: string,
 * ) => import("./cursor").Cursor}
 */
export const parseCursor = (content) => {
  const lines = content.split("\n").map(trimString).filter(isNotEmptyString);
  if (lines.length === 2) {
    return {
      stage: parseStageLine(lines[0]),
      index: parseIndexLine(lines[1]),
    };
  } else {
    throw new AranExecError("Cursor file should have two lines", { content });
  }
};

/**
 * @type {(
 *   cursor: import("./cursor").Cursor,
 * ) => string}
 */
export const stringifyCursor = ({ stage, index }) => `${stage}\n${index}\n`;

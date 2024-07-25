import { AranExecError } from "./error.mjs";
import { parseList } from "./list.mjs";

const {
  parseInt,
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
 * ) => {
 *   stage: import("./cursor").Stage,
 *   argv: string[],
 * }}
 */
const parseStageLine = (line) => {
  const [stage, ...argv] = line.split(/\s+/u);
  if (isStage(stage)) {
    return {
      stage,
      argv,
    };
  } else {
    throw new AranExecError("Invalid stage line", { line });
  }
};

/**
 * @type {(
 *   line: string
 * ) => {
 *   index: number,
 *   target: string,
 * }}
 */
const parseTargetLine = (line) => {
  const match = line.match(/^(\d+)(.*)$/u);
  if (match === null) {
    throw new AranExecError("Invalid target line", { line });
  } else {
    return {
      index: parseInt(match[1]),
      target: match[2].trim(),
    };
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
    throw new AranExecError("Empty cursor file", { content });
  } else if (lines.length === 1) {
    return {
      ...parseStageLine(lines[0]),
      ...{ index: 0, target: null },
    };
  } else if (lines.length === 2) {
    return {
      ...parseStageLine(lines[0]),
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
export const stringifyCursor = (cursor) =>
  `${cursor.stage}\n${cursor.index === null ? "" : `${cursor.index}\n`}${
    cursor.target === null ? "" : `${cursor.target}\n`
  }`;

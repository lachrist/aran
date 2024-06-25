import { parseList } from "./list.mjs";
import { fromNullable } from "./util.mjs";

/**
 * @type {(
 *   failure: import("./types").Failure,
 * ) => string}
 */
export const getFailureTarget = ({ target }) => target;

/**
 * @type {(
 *   failure: import("./types").Failure,
 * ) => string[]}
 */
export const listFailureCause = ({ causes }) => causes;

/**
 * @type {(
 *   cause: string
 * ) => string}
 */
const stringifyCause = (cause) => `  - ${cause}\n`;

/**
 * @type {(
 *   cause: string
 * ) => string}
 */
const stringifyTarget = (target) => `# ${target}\n`;

/**
 * @type {(
 *   failures: import("./types").Failure,
 * ) => string}
 */
export const stringifyFailure = (failure) =>
  `${stringifyTarget(failure.target)}${failure.causes
    .map(stringifyCause)
    .join("")}`;

/**
 * @type {(
 *   failures: import("./types").Failure[],
 * ) => string}
 */
export const stringifyFailureArray = (failures) =>
  failures.map(stringifyFailure).join("");

/**
 * @type {(
 *   line: string
 * ) => string | null}
 */
const parseTarget = (line) => {
  if (line.startsWith("#")) {
    return line.substring(1).trimStart();
  } else {
    return null;
  }
};

/**
 * @type {(
 *   line: string
 * ) => string | null}
 */
const parseCause = (line) => {
  if (line.startsWith("-")) {
    return line.substring(1).trimStart();
  } else {
    return null;
  }
};

/**
 * @type {(
 *   content: string,
 * ) => import("./types").Failure[]}
 */
export const parseFailureArray = (content) => {
  const lines = parseList(content);
  const { length } = lines;
  if (length === 0) {
    return [];
  } else {
    /** @type {import("./types").Failure[]} */
    const failures = [];
    /** @type {import("./types").Failure} */
    let failure = {
      target: fromNullable(parseTarget(lines[0])),
      causes: [],
    };
    for (let index = 1; index < length; index += 1) {
      const maybe_target = parseTarget(lines[index]);
      if (maybe_target === null) {
        failure.causes.push(fromNullable(parseCause(lines[index])));
      } else {
        failures.push(failure);
        failure = {
          target: maybe_target,
          causes: [],
        };
      }
    }
    return failures;
  }
};

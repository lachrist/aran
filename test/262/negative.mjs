import { AranError } from "./error.mjs";
import { parseList } from "./list.mjs";
import { fromNullable } from "./util.mjs";

const { RegExp, Map, undefined } = globalThis;

/**
 * @type {(
 *   line: string
 * ) => { head: boolean, body: string } | null}
 */
const parseMatchLine = (line) => {
  if (line.length === 0) {
    return null;
  } else {
    const head = line[0];
    const body = line.substring(1).trimStart();
    if (head === "-") {
      return { head: false, body };
    } else if (head === "~") {
      return { head: true, body };
    } else {
      return null;
    }
  }
};

/**
 * @type {(
 *   line: string,
 * ) => string | null}
 */
const parseTitleLine = (line) => {
  if (line.length === 0) {
    return null;
  } else {
    const char = line[0];
    if (char === "#") {
      return line.substring(1).trimStart();
    } else {
      return null;
    }
  }
};

/**
 * @type {(
 *   status1: import("./negative").Status,
 *   status2: import("./negative").Status,
 * ) => import("./negative").Status}
 */
const combineStatus = (status1, status2) => {
  if (status1 === "positive") {
    return status2;
  } else if (status2 === "positive") {
    return status1;
  } else if (status1 === "flaky" && status2 === "flaky") {
    return "flaky";
  } else if (status1 === "negative" && status2 === "negative") {
    return "negative";
  } else {
    throw new AranError("status mismatch");
  }
};

/**
 * @type {(
 *   negative: import("./negative").Negative,
 *   target: string
 * ) => string[]}
 */
export const listNegativeCause = (negative, target) => {
  const maybe_entry = negative.exact.get(target);
  const causes = maybe_entry === undefined ? [] : maybe_entry.causes.slice();
  for (const [regexp, entry] of negative.group) {
    if (regexp.test(target)) {
      causes.push(entry.cause);
    }
  }
  return causes;
};

/**
 * @type {(
 *   negative: import("./negative").Negative,
 *   target: string
 * ) => import("./negative").Status}
 */
export const getNegativeStatus = (negative, target) => {
  const maybe_entry = negative.exact.get(target);
  /** @type {import("./negative").Status} */
  let status =
    maybe_entry === undefined
      ? "positive"
      : maybe_entry.flaky
      ? "flaky"
      : "negative";
  for (const [regexp, entry] of negative.group) {
    if (regexp.test(status)) {
      status = combineStatus(status, entry.flaky ? "flaky" : "negative");
    }
  }
  return status;
};

/**
 * @type {(
 *   content: string
 * ) => import("./negative").Negative}
 */
export const parseNegative = (content) => {
  const lines = parseList(content);
  /**
   * @type {import("./negative").Negative}
   */
  const negative = {
    exact: new Map(),
    group: [],
  };
  if (lines.length > 0) {
    let cause = fromNullable(parseTitleLine(lines[0]));
    for (let index = 1; index < lines.length; index += 1) {
      const line = lines[index];
      const maybe_cause = parseTitleLine(line);
      if (maybe_cause !== null) {
        cause = maybe_cause;
      } else {
        const match = parseMatchLine(line);
        if (match !== null) {
          if (match.body.length > 0 && match.body[0] === "^") {
            negative.group.push([
              new RegExp(match.body, "u"),
              { flaky: match.head, cause },
            ]);
          } else {
            const entry = negative.exact.get(match.body);
            if (entry === undefined) {
              negative.exact.set(match.body, {
                flaky: match.head,
                causes: [cause],
              });
            } else if (entry.flaky !== match.head) {
              throw new AranError("flaky mismatch");
            } else {
              entry.causes.push(cause);
            }
          }
        } else {
          throw new AranError("unexpected line");
        }
      }
    }
  }
  return negative;
};

/* eslint-disable local/no-impure */
/* eslint-disable local/strict-console */
/* eslint-disable local/no-function */
/* eslint-disable local/no-class */

import { hasNarrowObject, join, print } from "./util/index.mjs";

const {
  console,
  console: { dir, log },
  Error,
  TypeError,
  SyntaxError,
  Reflect: { apply },
  String: {
    prototype: { trim, startsWith, slice, split },
  },
} = globalThis;

const ADDITIONAL_CALLSTACK_DEPTH = 3;

const getLocation = () => {
  const { stack } = new Error("dummy-message");
  if (stack == null) {
    return "???";
  } else {
    const lines = apply(split, stack, ["\n"]);
    if (lines.length < ADDITIONAL_CALLSTACK_DEPTH + 1) {
      return "???";
    } else {
      const line = apply(trim, lines[ADDITIONAL_CALLSTACK_DEPTH], []);
      if (apply(startsWith, line, ["at "])) {
        return apply(slice, line, [3]);
      } else {
        return line;
      }
    }
  }
};

// AranTypeError //

/**
 * @type {typeof import("./report").AranTypeError}
 */
// @ts-ignore
export const AranTypeError = class extends TypeError {
  constructor(/** @type {never} */ cause) {
    const message = `unsound type: ${print(cause)} at ${getLocation()}`;
    apply(log, console, [message]);
    apply(dir, console, [cause, { depth: 5 }]);
    super(message);
    this.cause = /** @type {any} */ (cause);
  }
};

// AranExecError //

/**
 * @type {typeof import("./report").AranExecError}
 */
export const AranExecError = class extends Error {
  constructor(/** @type {string} */ message, /** @type {unknown} */ cause) {
    apply(log, console, [`${message} at ${getLocation()}`]);
    apply(dir, console, [cause, { depth: 5 }]);
    super(message);
    this.cause = cause;
  }
};

// AranSyntaxError //

/**
 * @type {(
 *   cause: import("./report").SyntaxErrorCause,
 * ) => string}
 */
export const formatSyntaxErrorMessage = ({ node, hash, message }) => {
  if (
    typeof node === "object" &&
    node !== null &&
    hasNarrowObject(node, "loc")
  ) {
    const { loc } = node;
    if (
      typeof loc === "object" &&
      loc !== null &&
      hasNarrowObject(loc, "start")
    ) {
      const { start } = loc;
      if (
        typeof start === "object" &&
        start !== null &&
        hasNarrowObject(start, "line") &&
        hasNarrowObject(start, "column") &&
        typeof start.line === "number" &&
        typeof start.column === "number"
      ) {
        return `at [${start.line}:${start.column}] ${hash} >> ${message}`;
      }
    }
  }
  return `at ${hash} >> ${message}`;
};

export const AranSyntaxError = class extends SyntaxError {
  constructor(/** @type {import("./report").SyntaxErrorCause} */ cause) {
    super(formatSyntaxErrorMessage(cause));
    this.cause = cause;
  }
};

// AranConfigError //

/**
 * @type {(
 *   cause: import("./report").ConfigErrorCause,
 * ) => string}
 */
const formatConfigErrorMessage = ({ target, expect, actual }) =>
  `${target} should be ${expect}, but got: ${print(actual)}`;

/**
 * @type {typeof import("./report").AranConfigError}
 */
export const AranConfigError = class extends Error {
  constructor(/** @type {import("./report").ConfigErrorCause} */ cause) {
    super(formatConfigErrorMessage(cause));
    this.cause = cause;
  }
};

// AranDuplicateCutError //

/**
 * @type {(
 *   duplicate: import("./report").DuplicateCut,
 * ) => string}
 */
export const formatDuplicateCut = ({ advice, conflict }) =>
  `${advice} can only be triggered once but got triggered by: ${join(
    conflict,
    ", ",
  )}`;

/**
 * @type {typeof import("./report").AranDuplicateCutError}
 */
export const AranDuplicateCutError = class extends Error {
  constructor(/** @type {import("./report").DuplicateCut} */ cause) {
    super(formatDuplicateCut(cause));
    this.cause = cause;
  }
};

// AranVariableClashError //

/**
 * @type {(
 *  clash: import("./report").VariableClash
 * ) => string}
 */
export const formatVariableClash = ({ name, base, meta }) =>
  `External variable '${base}' clashes with config.${name} ('${meta}')`;

/**
 * @type {typeof import("./report").AranVariableClashError}
 */
export const AranVariableClashError = class extends Error {
  constructor(/** @type {import("./report").VariableClash} */ cause) {
    super(formatVariableClash(cause));
    this.cause = cause;
  }
};

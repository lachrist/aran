/* eslint-disable local/no-impure */
/* eslint-disable local/strict-console */
/* eslint-disable local/no-function */
/* eslint-disable local/no-class */

import { join, map, print } from "./util/index.mjs";

const {
  console,
  console: { dir, log },
  Error,
  JSON: { stringify },
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

///////////////////
// AranTypeError //
///////////////////

export const AranTypeError = class extends TypeError {
  constructor(/** @type {never} */ cause) {
    const message = `unsound type: ${print(cause)} at ${getLocation()}`;
    apply(log, console, [message]);
    apply(dir, console, [cause, { depth: 5 }]);
    super(message);
    this.name = "AranTypeError";
    this.cause = /** @type {unknown} */ (cause);
  }
};

///////////////////
// AranExecError //
///////////////////

export const AranExecError = class extends Error {
  constructor(/** @type {string} */ message, /** @type {unknown} */ cause) {
    apply(log, console, [`${message} at ${getLocation()}`]);
    apply(dir, console, [cause, { depth: 5 }]);
    super(message);
    this.name = "AranExecError";
    this.cause = cause;
  }
};

/////////////////////
// AranSyntaxError //
/////////////////////

export const AranSyntaxError = class extends SyntaxError {
  constructor(
    /** @type {string} */ message,
    /** @type {import("./error").SyntaxErrorCause} */ cause,
  ) {
    super(message);
    this.name = "AranSyntaxError";
    this.cause = cause;
  }
};

////////////////////
// AranInputError //
////////////////////

/**
 * @type {(
 *   condition: {
 *     target: string,
 *     actual: unknown,
 *   }
 * ) => string}
 */
const formatInputConditionMessage = ({ target, actual }) =>
  `${target} is ${print(actual)}`;

/**
 * @type {(
 *   cause: import("./error").InputErrorCause,
 * ) => string}
 */
const formatInputErrorMessage = ({ conditions, target, expect, actual }) => {
  const base = `${target} should be ${expect}, but got: ${print(actual)}`;
  if (conditions.length === 0) {
    return base;
  } else {
    return `if ${join(map(conditions, formatInputConditionMessage), " and ")} then ${base}`;
  }
};

export const AranInputError = class extends Error {
  constructor(/** @type {import("./error").InputErrorCause} */ cause) {
    super(formatInputErrorMessage(cause));
    this.name = "AranInputError";
    this.cause = cause;
  }
};

///////////////////////
// AranPointcutError //
///////////////////////

/**
 * @type {(
 *   cause: import("./error").PointcutErrorCause,
 * ) => string}
 */
export const formatPointcutErrorMessage = (cause) => {
  switch (cause.type) {
    case "DuplicateCut": {
      return `${cause.point} can only be triggered once but was triggered at #${stringify(cause.tag)} by: ${join(
        cause.conflict,
        ", ",
      )}`;
    }
    case "MissingCut": {
      return `${cause.point} must be triggered once at #${stringify(cause.tag)}`;
    }
    default: {
      throw new AranTypeError(cause);
    }
  }
};

export const AranPointcutError = class extends Error {
  constructor(/** @type {import("./error").PointcutErrorCause} */ cause) {
    super(formatPointcutErrorMessage(cause));
    this.name = "AranPointcutError";
    this.cause = cause;
  }
};

////////////////////
// AranClashError //
////////////////////

/**
 * @type {(
 *  clash: import("./error").ClashErrorCause,
 * ) => string}
 */
export const formatClashErrorMessage = (cause) => {
  switch (cause.type) {
    case "exact": {
      return `External variable '${cause.variable}' clashes with config.${cause.conf}`;
    }
    case "prefix": {
      return `External variable '${cause.variable}' starts with config.${cause.conf} (${cause.prefix})`;
    }
    default: {
      throw new AranTypeError(cause);
    }
  }
};

export const AranClashError = class extends Error {
  constructor(/** @type {import("./error").ClashErrorCause} */ cause) {
    super(formatClashErrorMessage(cause));
    this.cause = cause;
  }
};

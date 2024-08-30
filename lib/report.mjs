/* eslint-disable local/no-impure */
/* eslint-disable local/strict-console */
/* eslint-disable local/no-function */
/* eslint-disable local/no-class */

import { hasNarrowObject, join, print } from "./util/index.mjs";

const {
  SyntaxError,
  console,
  console: { dir, log },
  Reflect: { apply },
  Error,
  TypeError,
} = globalThis;

// AranTypeError //

/**
 * @type {typeof import("./report").AranTypeError}
 */
// @ts-ignore
export const AranTypeError = class extends TypeError {
  constructor(/** @type {never} */ cause) {
    const message = `unsound type: ${print(cause)}`;
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
    apply(log, console, [message]);
    apply(dir, console, [cause, { depth: 5 }]);
    super(message);
    this.cause = cause;
  }
};

// AranIllegalSyntaxError //

/**
 * @type {(
 *   illegal: import("./report").IllegalSyntax,
 * ) => string}
 */
export const formatIllegalSyntax = ({ message, node }) => {
  const location = hasNarrowObject(node, "loc") ? node.loc : null;
  if (location == null) {
    return message;
  } else {
    return `${message} at ${location.start.line}:${location.start.column}`;
  }
};

/**
 * @type {typeof import("./report").AranIllegalSyntaxError}
 */
export const AranIllegalSyntaxError = class extends SyntaxError {
  constructor(/** @type {import("./report").IllegalSyntax} */ cause) {
    super(formatIllegalSyntax(cause));
    this.cause = cause;
  }
};

// AranIllegalInputError //

/**
 * @type {(
 *   illegal: import("./report").IllegalInput,
 * ) => string}
 */
export const formatIllegalInput = ({ target, expect, actual }) =>
  `${target} should be ${expect}, but got: ${print(actual)}`;

/**
 * @type {typeof import("./report").AranIllegalInputError}
 */
export const AranIllegalInputError = class extends Error {
  constructor(/** @type {import("./report").IllegalInput} */ cause) {
    super(formatIllegalInput(cause));
    this.cause = cause;
  }
};

// AranWarningError //

/**
 * @type {{
 *   [key in import("./report").WarningName]: string
 * }}
 */
export const WARNING_MESSAGE = {
  ExternalConstant: "External constant might be modified",
  ExternalDeadzone: "External deadzone might not be honored",
  ExternalSloppyFunction: "External sloppy function might clash",
  ExternalLateDeclaration: "External late declaration has been internalized",
};

/**
 * @type {(
 *   warning: import("./report").Warning
 * ) => string}
 */
export const formatWarning = ({ name, path }) =>
  `[${name}] ${WARNING_MESSAGE[name]} at ${path}`;

/**
 * @type {typeof import("./report").AranWarningError}
 */
export const AranWarningError = class extends Error {
  constructor(/** @type {import("./report").Warning} */ cause) {
    super(formatWarning(cause));
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

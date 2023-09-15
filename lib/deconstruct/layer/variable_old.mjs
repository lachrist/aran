import { DynamicError } from "../../util/index.mjs";

import { isParameter } from "../../node.mjs";

const {
  RegExp: {
    prototype: { test: testRegExp },
  },
  Reflect: { apply },
  String: {
    prototype: { substring, split },
  },
} = globalThis;

const ONE = [1];

const TWO = [2];

/** @typedef {Brand<string, "MetaVariable">} MetaVariable */

/** @typedef {Brand<string, "BaseVariable">} BaseVariable */

/** @typedef {Brand<string, "VariableSegment">} VariableSegment */

/**
 * @typedef {(
 *   | "pattern"
 *   | "expression"
 *   | "effect"
 *   | "statement"
 *   | "block"
 * )} CompilationVariableKind
 */

/**
 * @typedef {{
 *   type: "compilation",
 *   identifier: Variable,
 *   hash: VariableSegment,
 *   kind: CompilationVariableKind,
 *   description: VariableSegment,
 * } | {
 *   type: "parameter",
 *   identifier: Parameter,
 *   name: Parameter,
 * } | {
 *   type: "deadzone",
 *   identifier: Variable,
 *   name: Variable,
 * } | {
 *   type: "original",
 *   identifier: Variable,
 *   name: Variable,
 * }} VariableData
 */

const META = "_";

const BASE = "$";

const ORIGINAL = "O";

const DEADZONE = "X";

const SEPARATOR = "$";

const SEPARATOR_SINGLETON = [SEPARATOR];

const variable_segment_regexp = /^[_0-9a-zA-Z]*$/u;

/** @type {(input: string) => input is VariableSegment} */
export const isVariableSegment = (input) =>
  apply(testRegExp, variable_segment_regexp, [input]);

/** @type {(variable: Variable) => BaseVariable} */
export const mangleBaseOriginalVariable = (variable) =>
  /** @type {BaseVariable} */ (`${BASE}${ORIGINAL}${variable}`);

/** @type {(variable: Variable) => BaseVariable} */
export const mangleBaseDeadzoneVariable = (variable) =>
  /** @type {BaseVariable} */ (`${BASE}${DEADZONE}${variable}`);

/**
 * @type {(
 *   hash: VariableSegment,
 *   kind: CompilationVariableKind,
 *   description: string,
 * ) => MetaVariable}
 */
export const mangleMetaVariable = (hash, kind, description) =>
  /** @type {MetaVariable} */ (
    `${META}${description}${SEPARATOR}${kind}${SEPARATOR}${hash}`
  );

/** @type {(variable: Variable) => string} */
const prettifyVariable = (variable) => {
  if (variable[0] === "Meta") {
    return `aran.${apply(substring, variable, ONE)}`;
  } else if (variable[0] === "Base") {
    if (variable[1] === "Original") {
      return apply(substring, variable, TWO);
    } else if (variable[1] === "Deadzone") {
      return `deadzone.${apply(substring, variable, TWO)}`;
    } else {
      throw new DynamicError("invalid base variable", variable);
    }
  } else {
    throw new DynamicError("invalid variable layer", variable);
  }
};

/** @type {(variable: Variable) => VariableData} */
export const unmangle = (variable) => {
  if (isParameter(variable)) {
    return {
      type: "parameter",
      name: variable,
    };
  } else if (variable[0] === META) {
    const segments = apply(
      split,
      apply(substring, variable, ONE),
      SEPARATOR_SINGLETON,
    );
    if (segments.length !== 3) {
      throw new DynamicError("invalid meta variable", variable);
    } else {
      return {
        type: "compilation",
        hash: segments[2],
        kind: segments[1],
        description: segments[0],
      };
    }
  } else if (variable[0] === BASE) {
    if (variable[1] === ORIGINAL) {
      return {
        type: "original",
        name: apply(substring, variable, TWO),
      };
    } else if (variable[1] === DEADZONE) {
      return {
        type: "deadzone",
        name: apply(substring, variable, TWO),
      };
    } else {
      throw new DynamicError("invalid base variable", variable);
    }
  } else {
    throw new DynamicError("invalid variable layer", variable);
  }
};

/** @type {(variable: string) => variable is MetaVariable} */
export const isMetaVariable = (variable) => variable[0] === META;

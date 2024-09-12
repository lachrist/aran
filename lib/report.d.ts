/**
 * An overview of the errors that Aran can throw:
 *
 * - Probably a bug in Aran:
 *   - `AranExecError`
 *   - `AranTypeError`
 *   - Any non-Aran error.
 * - Definitely *not* a bug in Aran:
 *   - `AranIllegalInputError`
 *   - `AranVariableClashError`
 *   - `AranDuplicateCutError`
 *
 * @module
 */

import type { Variable } from "./estree";

///////////////////
// AranExecError //
///////////////////

/**
 * Signals a probable bug in Aran.
 */
export class AranExecError extends Error {
  constructor(message: string, cause: unknown);
  message: string;
  cause: unknown;
}

///////////////////
// AranTypeError //
///////////////////

/**
 * Signals a loophole in typescript annotations. Unless, `source.root` is not a
 * valid `estree.Program`, this probably signals a bug in Aran.
 */
export class AranTypeError extends TypeError {
  constructor(cause: never);
  message: string;
  cause: never;
}

///////////////////////////
// AranIllegalInputError //
///////////////////////////

export type IllegalInput = {
  /**
   * A description of the input location -- eg: `"config.advice_variable"`.
   */
  target: string;
  /**
   * A description of the expected value -- eg: `"a string"`.
   */
  expect: string;
  /**
   * The actual input value.
   */
  actual: unknown;
};

/**
 * Signals an early syntax error when `config.early_syntax_error` is `"throw"`.
 */
export class AranIllegalInputError extends Error {
  constructor(cause: IllegalInput);
  message: string;
  cause: IllegalInput;
}

////////////////////////////
// AranVariableClashError //
////////////////////////////

export type VariableClash = {
  name: "intrinsic_variable" | "advice_variable" | "escape_prefix";
  base: Variable;
  meta: Variable;
};

/**
 * Signals a clash between Aran variables and the variables of the target code.
 */
export class AranVariableClashError extends Error {
  constructor(cause: VariableClash);
  message: string;
  cause: VariableClash;
}

///////////////////////////
// AranDuplicateCutError //
///////////////////////////

export type DuplicateCut = {
  advice: "eval@before" | "apply@around" | "construct@around";
  conflict: Variable[];
};

/**
 * Signals that a join point has been cut multiple times when it was illegal.
 * This can only happen when using the flexible API: `config.standard_flexible`.
 * Here are the join points that can be cut at most once: `apply@around`,
 * `construct@around`, and `eval@before`.
 */
export class AranDuplicateCutError extends Error {
  constructor(cause: DuplicateCut);
  message: string;
  cause: DuplicateCut;
}

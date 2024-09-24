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

import type { Hash } from "./hash";
import type { Node, Variable } from "./estree";

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

/////////////////////
// AranConfigError //
/////////////////////

export type ConfigErrorCause = {
  /**
   * A description of the config location -- eg: `"config.advice_variable"`.
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
 * Signals a problem with the configuration of Aran.
 */
export class AranConfigError extends Error {
  constructor(cause: ConfigErrorCause);
  message: string;
  cause: ConfigErrorCause;
}

/////////////////////
// AranSyntaxError //
/////////////////////

export type SyntaxErrorCause = {
  /**
   * The node that caused the syntax error.
   */
  node: Node | null;
  /**
   * The hash of the node that caused the syntax error.
   */
  hash: Hash;
  /**
   * The explanation of the syntax error.
   */
  message: string;
};

/**
 * Signals an early syntax error in the program to be instrumented -- eg: the
 * root node is not actually an `estree.Program` or presence of `WithStatement`
 * in strict code. In general, popular parsers like acorn should not produce
 * data that would trigger this error. However, when parsing local code (ie code
 * to be fed to a direct eval call), one may have to use more lenient parsing
 * which could trigger this error.
 */
export class AranSyntaxError extends SyntaxError {
  constructor(cause: SyntaxErrorCause);
  message: string;
  cause: SyntaxErrorCause;
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

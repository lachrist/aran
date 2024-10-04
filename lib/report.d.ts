/**
 * An overview of the errors that Aran can throw:
 *
 * - Probably a bug in Aran:
 *   - `AranExecError`
 *   - `AranTypeError`
 *   - Any non-Aran error.
 * - Definitely *not* a bug in Aran:
 *   - `AranConfigError`
 *   - `AranClashError`
 *   - `AranSyntaxError`
 *   - `AranPointcutError`
 *
 * @module
 */

import type {
  VariableName,
  SyntaxErrorCause as EstreeSentrySyntaxErrorCause,
} from "estree-sentry";
import type { Hash } from "./hash";

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
  name: "AranTypeError";
  message: string;
  cause: unknown;
}

/////////////////////
// AranConfigError //
/////////////////////

export type InputErrorCause = {
  conditions: {
    target: string;
    actual: unknown;
  }[];
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
export class AranInputError extends Error {
  constructor(cause: InputErrorCause);
  name: "AranConfigError";
  message: string;
  cause: InputErrorCause;
}

/////////////////////
// AranSyntaxError //
/////////////////////

/**
 * Signals a syntax error in `file.root` that is type-related -- eg: a property
 * type mismatch. See
 * [estree-sentry](http://github.com/lachrist/estree-sentry-2) for more details.
 */
export type SimpleSyntaxErrorCause = {
  type: "simple";
} & EstreeSentrySyntaxErrorCause;

/**
 * Signals a syntax error in `file.root` that is context-dependent -- eg:
 * duplicate variable declarations or with statement in strict mode.
 */
export type ComplexSyntaxErrorCause = {
  type: "complex";
  /**
   * The hash of the node that caused the syntax error.
   */
  hash: Hash;
};

export type SyntaxErrorCause = SimpleSyntaxErrorCause | ComplexSyntaxErrorCause;

/**
 * Signals an early syntax error in the program to be instrumented -- eg: the
 * root node is not actually an `estree.Program` or presence of `WithStatement`
 * in strict code. In general, popular parsers like acorn should not produce
 * data that would trigger this error. However, when parsing local code (ie code
 * to be fed to a direct eval call), one may have to use more lenient parsing
 * which could trigger this error.
 */
export class AranSyntaxError extends SyntaxError {
  constructor(message: string, cause: SyntaxErrorCause);
  name: "AranSyntaxError";
  message: string;
  cause: SyntaxErrorCause;
}

////////////////////
// AranClashError //
////////////////////

export type ClashErrorCause = {
  name: "intrinsic_variable" | "advice_variable" | "escape_prefix";
  base: VariableName;
  meta: VariableName;
};

/**
 * Signals a clash between Aran variables and the variables of the target code.
 */
export class AranClashError extends Error {
  constructor(cause: ClashErrorCause);
  name: "AranClashError";
  message: string;
  cause: ClashErrorCause;
}

///////////////////////
// AranPointcutError //
///////////////////////

/**
 * Signals that a join point has been cut multiple times when it was illegal.
 * This can only happen when using the flexible API: `conf.standard_flexible`.
 */
export type DuplicatePointcutErrorCause = {
  type: "DuplicateCut";
  point: "eval@before" | "apply@around" | "construct@around";
  conflict: VariableName[];
  hash: Hash;
};

/**
 * Signals that a join point has not been cut when it was required to do so.
 * Only the `eval@before`
 */
export type MissingPointcutErrorCause = {
  type: "MissingCut";
  point: "eval@before";
  hash: Hash;
};

export type PointcutErrorCause =
  | DuplicatePointcutErrorCause
  | MissingPointcutErrorCause;

/**
 * Signals a problem with the provided pointcut.
 */
export class AranPointcutError extends Error {
  constructor(cause: PointcutErrorCause);
  name: "AranPointcutError";
  message: string;
  cause: PointcutErrorCause;
}

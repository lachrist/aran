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

export type ClashErrorCause = {
  name: "intrinsic_variable" | "advice_variable" | "escape_prefix";
  base: VariableName;
  meta: VariableName;
};

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

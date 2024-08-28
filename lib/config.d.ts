import type { Variable } from "./estree";
import type { Json } from "./json";
import type { Pointcut as StandardPointcut } from "./weave/standard/aspect";
import type { Pointcut as FlexiblePointcut } from "./weave/flexible/aspect";

export type Config = {
  /**
   * Defines the behavior of warnings:
   *
   * - `embed`: warnings are stored in `_aran_warning_array_`
   * - `console`: warnings are reported with `console.warn`
   * - `ignore`: warnings are ignored
   * - `throw`: if present, the first warning is thrown as an error
   *
   * Default: `embed`.
   */
  warning: "embed" | "console" | "ignore" | "throw";
  /**
   * Indicate whether the global declarative record should be emulated or not.
   * NB: The global declarative record is a scope frame that sits right before
   * the global object. For instance, in *script* code (not eval code nor module
   * code): `let x = 123` will cause the creation of a binding in the global
   * declarative record and not in the global object. Unfortunately, this record
   * cannot be accessed inside the language and we are stuck with two imperfect
   * options:
   *
   * - `builtin`: The builtin global declarative record is used, access to
   * global variables will happens via parameters: `scope.read`,
   * `scope.writeSloppy`, etc... Tracking values through these calls requires
   * additional logic.
   * - `emulate`: A plain object is used to emulate the global declarative
   * record. That means that instrumented code will never access the builtin
   * global declarative record. Hence, every single bit of code should be
   * instrumented which might be a hard requirement to meet.
   *
   * Default: `builtin`.
   */
  global_declarative_record: "builtin" | "emulate";
  /**
   * Defines the behavior of early syntax errors:
   *
   * - `embed`: The instrumentation will succeed but executing the instrumented
   * code will cause the first syntax error to be thrown. The error is reported
   * late but it originates from the target realm of the code.
   * - `throw`: The instrumentation throw the first early syntax error as an
   * `AranSyntaxError` with extends `SyntaxError`. The error is reported early
   * but it originates from the current realm and not not the target realm of
   * the code.
   *
   * Default: `embed`.
   */
  early_syntax_error: "embed" | "throw";
  /** TODO */
  mode: "normal" | "standalone";
  /** TODO */
  global_variable: Variable;
  /** TODO */
  intrinsic_variable: Variable;
  /** TODO */
  escape_prefix: Variable;
  /** TODO */
  advice_variable: Variable;
  /** TODO */
  initial_state: Json;
  /** TODO */
  standard_pointcut: null | StandardPointcut;
  /** TODO */
  flexible_pointcut: null | FlexiblePointcut;
};

import type {
  Program as EstreeProgram,
  Kind as EstreeNodeKind,
  Path as EstreeNodePath,
  ScriptProgram as ScriptEstreeProgram,
  SyntaxErrorCause,
} from "estree-sentry";
import type { Situ } from "./source";
import type { Warning } from "./unbuild/prelude/warning";
import type { Pointcut as StandardPointcut } from "./weave/standard/aspect";
import type { Pointcut as FlexiblePointcut } from "./weave/flexible/aspect";
import type { Json } from "./json";
import type {
  ClashErrorCause,
  InputErrorCause,
  PointcutErrorCause,
} from "./report";
import type { Parameter } from "./lang";
import type {
  ControlKind,
  ClosureKind,
  SegmentKind,
  ProgramKind,
} from "./weave/parametrization";

export type { Kind as NodeKind, Path as NodePath } from "estree-sentry";

export type {
  Situ,
  GlobalSitu,
  RootLocalSitu as LocalSitu,
  DeepLocalSitu as AranSitu,
} from "./source";

export type {
  Primitive as AranPrimitive,
  RuntimePrimitive as AranRuntimePrimitve,
  IntrinsicRecord as AranIntrinsicRecord,
  Intrinsic as AranIntrinsicName,
  Parameter as AranParameter,
} from "./lang";

export {
  ProgramKind as AranProgramKind,
  ClosureKind as AranClosureKind,
  SegmentKind as AranSegmentKind,
  ControlKind as AranControlKind,
} from "./weave/parametrization";

export type {
  Specifier as AranSpecifier,
  Source as AranSource,
  ArgVariable as AranVariable,
  Label as AranLabel,
  GenNode as AranNode,
  GenProgram as AranProgram,
  GenSegmentBlock as AranSegmentBlock,
  GenRoutineBlock as AranRoutineBlock,
  GenStatement as AranStatement,
  GenEffect as AranEffect,
  GenExpression as AranExpression,
} from "./weave/atom";

export type {
  Pointcut as StandardPointcut,
  Aspect as StandardAspect,
  Advice as StandardAdvice,
} from "./weave/standard/aspect.d.ts";

export type {
  Pointcut as FlexiblePointcut,
  Aspect as FlexibleAspect,
  HeterogeneousAspect as HeterogeneousFlexibleAspect,
  HomogeneousAspect as HomogeneousFlexibleAspect,
} from "./weave/flexible/aspect.d.ts";

///////////
// Error //
///////////

/**
 * Signals a probable bug in Aran.
 */
export class AranExecError extends Error {
  constructor(message: string, cause: unknown);
  message: string;
  cause: unknown;
}

/**
 * Signals a loophole in typescript annotations and a probable Aran bug.
 */
export class AranTypeError extends TypeError {
  constructor(cause: never);
  name: "AranTypeError";
  message: string;
  cause: unknown;
}

/**
 * Signals an invalid input.
 */
export class AranInputError extends Error {
  constructor(cause: InputErrorCause);
  name: "AranConfigError";
  message: string;
  cause: InputErrorCause;
}
/**
 * Signals a problem within  the syntax of the target code.
 */
export class AranSyntaxError extends SyntaxError {
  constructor(message: string, cause: SyntaxErrorCause);
  name: "AranSyntaxError";
  message: string;
  cause: SyntaxErrorCause;
}
/**
 * Signals a clash between Aran variables and the variables of the target code.
 */
export class AranClashError extends Error {
  constructor(cause: ClashErrorCause);
  name: "AranClashError";
  message: string;
  cause: ClashErrorCause;
}

/**
 * Signals a problem with the provided pointcut.
 */
export class AranPointcutError extends Error {
  constructor(cause: PointcutErrorCause);
  name: "AranPointcutError";
  message: string;
  cause: PointcutErrorCause;
}

///////////
// Setup //
///////////

/**
 * Configuration object for the `setup` function.
 */
export type SetupConf = {
  /**
   * The global variable that refer to the global object. Only change this if
   * `globalThis` do not refer to the global object for some reason.
   * @defaultValue `"globalThis"`
   */
  global_variable: string;
  /**
   * The global variable for holding the intrinsic record.
   * @defaultValue `"_ARAN_INTRINSIC_"`
   */
  intrinsic_variable: string;
};

/**
 * Generates a `estree.Program` that should be executed before executing any
 * instrumented code. In the standalone mode, the setup code is bundled with the
 * instrumented code and this function should not be used.
 * @param conf The configuration of the setup program.
 * @returns The setup script program. Can be passed to an estree code generator
 * such as `astring`.
 * @throws {@link AranInputError} If the configuration is invalid.
 */
export const generateSetup: (
  conf?: Partial<SetupConf>,
) => ScriptEstreeProgram<{}>;

/**
 * - `acorn.parse(code, {ecmaVersion: 2024})`
 * - `@babel/parser.` with estree plugin
 */
export type Program = {
  type: "Program";
  sourceType: "module" | "script";
  body: unknown[];
};

/**
 * A parsed JavaScript program. Represents both static code and dynamically
 * generated code.
 */
export type File<P> = {
  /**
   * The `estree.Program` node to instrument.
   */
  root: Program;
  /**
   * Indicates how the source will be executed.
   * @defaultValue Either `"script"` or `"module"` based on
   * `file.root.sourceType`.
   */
  kind: "module" | "script" | "eval";
  /**
   * Further precises the context in which the source will be executed. Only
   * relevant when `source.kind` is `"eval"`.
   * - `GlobalSitu`: The source will be executed in the global context. It is
   * the only valid option when `source.kind` is `"module"` or `"script"`.
   * - `RootLocalSitu`: The source will be executed in a local context that is
   * not controlled by Aran -- ie: a direct eval call within non-instrumented
   * code.
   * - `DeepLocalSitu`: The source will be executed in a local context that is
   * controlled by Aran -- ie: direct eval call within instrumented code. This
   * data structure is provided by Aran as argument to the `eval@before` aspect.
   * @defaultValue `{ type: "global" }`
   */
  situ: Situ;
  /**
   * An identifier for the file. It is passed to `conf.digest` to help
   * generating unique node hash.
   */
  path: P;
};

/**
 * @template H
 * The type of the hash. Either a string or a number. Can be branded -- eg:
 * `string & { __brand: "hash" }`.
 * @param node The estree node to hash.
 * @param node_path The json path of the node in starting from `file.root`. It
 * is composed of the properties names that lead to the node concatenated with
 * dots. So integers properties are within bracket. For instance:
 * `"body.0.declarations.0.init"`.
 * @param file_path The path of the file containing the node as provided by
 * `file.path`.
 * @param node_kind The kind of the node -- eg: `"Program`", `"Statement"`,
 * `"Expression"`, ...
 * @returns The hash of the node. It should be unique for each node in the
 * program `file.root`. It is safe to simply returns `node_path`.
 */
export type Digest<P, H extends string | number> = (
  node: object,
  node_path: EstreeNodePath,
  file_path: P,
  node_kind: EstreeNodeKind,
) => H;

export type { Json } from "./json";

/**
 * Configuration object for the `instrument` function.
 */
export type Conf<P, H extends string | number> = {
  /**
   * Indicates whether or not the setup code should be bundle with the
   * instrumented code. The setup code is generated by `generateSetup` and
   * simply defines a global variable that holds all the intrinsic values used
   * by Aran.
   * - `"normal"`: Do not bundle the setup code with the instrumented code.
   *   Setup code is expected to have been executed once before any instrumented
   *   code. This is the mode you should use for real-world use cases.
   * - `"standalone"`: Bundle the setup code with the instrumented code. It does
   *   no longer require prior execution of the setup code but multiple
   *   instrumented code will interact well. This is the mode you should use to
   *   investigate and share standalone instrumented snippets.
   * @defaultValue `"normal"`
   */
  mode: "normal" | "standalone";
  /**
   * The pointcut for the standard weaving API. Either `standard_pointcut` or
   * `flexible_pointcut` should be defined but not both.
   * @defaultValue `null`
   */
  standard_pointcut: null | StandardPointcut<H>;
  /**
   * The pointcut for the flexible weaving API. Either `standard_pointcut` or
   * `flexible_pointcut` should be defined but not both.
   * @defaultValue `null`
   */
  flexible_pointcut: null | FlexiblePointcut<H>;
  /**
   * The initial state passed to advice functions. It will be cloned with JSON
   * serialization.
   * @defaultValue `null`
   */
  initial_state: Json;
  /**
   * Indicates whether the global declarative record should be emulated or not.
   * NB: The global declarative record is a scope frame that sits right before
   * the global object. For instance, in *script* code (not eval code nor module
   * code): `let x = 123` will cause the creation of a binding in the global
   * declarative record and not in the global object. Unfortunately, this record
   * cannot be accessed inside the language and we are stuck with two imperfect
   * options:
   * - `"builtin"`: The builtin global declarative record is used, access to
   *   global variables will happen via parameter functions such as:
   *   `scope.read`, `scope.writeSloppy`, etc... Tracking values through these
   *   calls requires additional logic.
   * - `"emulate"`: A plain object is used to emulate the global declarative
   *   record. That means that instrumented code will never access the builtin
   *   global declarative record. Hence, every single bit of code should be
   *   instrumented which might be a hard requirement to meet.
   * @defaultValue `"builtin"`
   */
  global_declarative_record: "builtin" | "emulate";
  /**
   * The global variable that refer to the global object. This is only used when
   * `mode` is `"standalone"`. Change this value only if `globalThis` do not
   * refer to the global object for some reason.
   * @defaultValue `"globalThis"`
   */
  global_variable: string;
  /**
   * The global variable that refers to the intrinsic object defined by the
   * setup code. Make sure it does not clash with other global variables.
   * @defaultValue `"_ARAN_INTRINSIC_"`
   */
  intrinsic_variable: string;
  /**
   * The global variable that refers to the advice object for standard weaving.
   * Make sure it does not clash with other global variables.
   * @defaultValue `"_ARAN_ADVICE_"`
   */
  advice_variable: string;
  /**
   * Internal variables are prefixed with this string to avoid clashing with
   * external variables.
   * @defaultValue `"_aran_"`
   */
  escape_prefix: string;
  digest: Digest<P, H>;
};

/**
 *
 * Instrument a parsed JavaScript program. It is the main function of Aran.
 *
 * @template P The type of `file.path`.
 * @template H The type of node hashes as returned by `conf.digest`.
 * @param file The parsed JavaScript program to instrument.
 * @param conf Instrumentation options.
 * @returns The instrumented program along with warnings. Can be fed to a estree
 * code generator like `astring`.
 * @throws {@link AranInputError} If `conf` is invalid or if the top
 * level properties of `file` are invalid.
 * @throws {@link AranSyntaxError} If there is problem with the AST at
 * `file.root` either because there is an early syntax error or because it is
 * not a valid ESTree program.
 * @throws {@link AranClashError} If there is a clash between Aran variables and
 * the variable in `file.root`.
 * @throws {@link AranPointcutError} If there is a problem with the provided
 * pointcut.
 */
export const instrument: <P, H extends number | string>(
  file: Partial<File<P>>,
  conf?: null | undefined | Partial<Conf<P, H>>,
) => EstreeProgram<{}> & {
  _aran_warning_array: Warning[];
};

////////////
// Helper //
////////////

/**
 * Indicates whether the block refered by the kind is a closure block -- ie: the
 * body of a function, an arrow, a generator, or a method.
 */
export const isClosureKind: (kind: string) => kind is ClosureKind;

/**
 * Indicates whether the block refered by the kind is a program block -- ie: a
 * the body of a script or a module.
 */
export const isProgramKind: (kind: string) => kind is ProgramKind;

/**
 * Indicates whether the block refered by the kind is a control block -- ie: a
 * a block which appears in control flow statements such as an if statement.
 */
export const isSegmentKind: (kind: string) => kind is SegmentKind;

/**
 * List the parameters of a given block kind.
 */
export const listParameter: (kind: ControlKind) => Parameter[];

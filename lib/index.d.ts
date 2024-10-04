import type {
  Program as EstreeProgram,
  Kind as EstreeKind,
  Path as EstreePath,
  ScriptProgram as ScriptEstreeProgram,
} from "estree-sentry";
import type { Situ } from "./source";
import type { Warning } from "./unbuild/prelude/warning";
import type { Pointcut as StandardPointcut } from "./weave/standard/aspect";
import type { Pointcut as FlexiblePointcut } from "./weave/flexible/aspect";
import type { Json } from "./json";

export type { Situ, GlobalSitu, RootLocalSitu, DeepLocalSitu } from "./source";

export type {
  Primitive as AranPrimitive,
  RuntimePrimitive as AranRuntimePrimitve,
  IntrinsicRecord as AranIntrinsicRecord,
  Intrinsic as AranIntrinsicName,
  Parameter as AranParameter,
} from "./lang";

export { ProgramKind, ClosureKind, ControlKind } from "./weave/parametrization";

export type {
  Specifier as AranSpecifier,
  Source as AranSource,
  ArgVariable as AranVariable,
  Label as AranLabel,
  GenNode as AranNode,
  GenProgram as AranProgram,
  GenControlBlock as AranControlBlock,
  GenRoutineBlock as AranRoutineBlock,
  GenStatement as AranStatement,
  GenEffect as AranEffect,
  GenExpression as AranExpression,
} from "./weave/atom";

export type {
  AranTypeError,
  AranExecError,
  AranInputError,
  AranSyntaxError,
  AranClashError,
  AranPointcutError,
} from "./report.d.ts";

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

/**
 * Configuration object for the `setup` function.
 */
export type SetupConf = {
  global_variable: string;
  intrinsic_variable: string;
};

/**
 *
 * Generates a `estree.Program` that should be executed prior executing any code
 * instrumented with `config.mode` set to "normal". If `config.mode` is set to
 * `"standalone"`, the setup code is bundled with the instrumented code and this
 * function should not be used.
 *
 * Default for `config.global_variable`: `"globalThis"`.
 * Default for `config.intrinsic_variable`: `"_ARAN_INTRINSIC_"`.
 *
 * @param conf The configuration of the setup program.
 * @returns The setup script program. Can be passed to a estree code generator
 * such as `astring`.
 *
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

export type File<P> = {
  /**
   * The `estree.Program` node to instrument.
   */
  root: Program;
  /**
   * Indicates how the source will be executed.
   *
   * Default: either `"script"` or `"module"` based on `source.root.sourceType`.
   */
  kind: "module" | "script" | "eval";
  /**
   * Further precises the context in which the source will be executed. Only
   * relevant when `source.kind` is `"eval"`.
   *
   * - `GlobalSitu`: The source will be executed in the global context. It is
   * the only valid option when `source.kind` is `"module"` or `"script"`.
   * - `RootLocalSitu`: The source will be executed in a local context that is
   * not controlled by Aran -- ie: a direct eval call within non-instrumented
   * code.
   * - `DeepLocalSitu`: The source will be executed in a local context that is
   * controlled by Aran -- ie: direct eval call within instrumented code. This
   * data structure is provided by Aran as argument to the `eval@before` aspect.
   *
   * Default: `{ type: "global" }`.
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
 * @param kind The kind of the node -- eg: `"Program`", `"Statement"`,
 * `"Expression"`, ...
 * @returns The hash of the node. It should be unique for each node in the
 * program `file.root`. It is safe to simply returns `node_path`.
 */
export type Digest<P, H extends string | number> = (
  node: object,
  node_path: EstreePath,
  file_path: P,
  kind: EstreeKind,
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
   *
   * - `"normal"`: Do not bundle the setup code with the instrumented code.
   *   Setup code is expected to have been executed once before any instrumented
   *   code. This is the mode you should use for real-world use cases.
   * - `"standalone"`: Bundle the setup code with the instrumented code. It does
   *   no longer require prior execution of the setup code but multiple
   *   instrumented code will interact well. This is the mode you should use to
   *   investigate and share standalone instrumented snippets.
   *
   * Default: `"normal"`.
   */
  mode: "normal" | "standalone";
  /**
   * The pointcut for the standard weaving API. Either `standard_pointcut` or
   * `flexible_pointcut` should be defined but not both.
   *
   * Default: `null`.
   */
  standard_pointcut: null | StandardPointcut<H>;
  /**
   * The pointcut for the flexible weaving API. Either `standard_pointcut` or
   * `flexible_pointcut` should be defined but not both.
   *
   * Default: `null`.
   */
  flexible_pointcut: null | FlexiblePointcut<H>;
  /**
   * The initial state passed to advice functions. It will be cloned with JSON
   * serialization.
   *
   * Default: `null`.
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
   *
   * - `"builtin"`: The builtin global declarative record is used, access to
   *   global variables will happen via parameter functions such as:
   *   `scope.read`, `scope.writeSloppy`, etc... Tracking values through these
   *   calls requires additional logic.
   * - `"emulate"`: A plain object is used to emulate the global declarative
   *   record. That means that instrumented code will never access the builtin
   *   global declarative record. Hence, every single bit of code should be
   *   instrumented which might be a hard requirement to meet.
   *
   * Default: `"builtin"`.
   */
  global_declarative_record: "builtin" | "emulate";
  /**
   * The global variable that refer to the global object. This is only used when
   * `mode` is `"standalone"`. Change this value only if `globalThis` do not
   * refer to the global object for some reason.
   *
   * Default: `globalThis`.
   */
  global_variable: string;
  /**
   * The global variable that refers to the intrinsic object defined by the
   * setup code. Make sure it does not clash with other global variables.
   *
   * Default: `"_ARAN_INTRINSIC_"`.
   */
  intrinsic_variable: string;
  /**
   * The global variable that refers to the advice object for standard weaving.
   * Make sure it does not clash with other global variables.
   *
   * Default: `"_ARAN_ADVICE_"`.
   */
  advice_variable: string;
  /**
   * Internal variables are prefixed with this string to avoid clashing with
   * external variables.
   *
   * Default: `"_aran_"`.
   */
  escape_prefix: string;
  digest: Digest<P, H>;
};

/**
 *
 * The main instrumentation function of aran.
 *
 * @template H
 * @param raw_source
 * @param raw_config
 * @returns The instrumented program and the warnings.
 *
 */
export const instrument: <P, H extends number | string>(
  file: Partial<File<P>>,
  conf?: null | undefined | Partial<Conf<P, H>>,
) => EstreeProgram<{}> & {
  _aran_warning_array: Warning[];
};

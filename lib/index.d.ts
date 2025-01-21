import type {
  Program as EstreeProgram,
  ScriptProgram as EstreeScriptProgram,
  SyntaxErrorCause,
} from "estree-sentry";
import type { Warning } from "./trans/prelude/warning";
import type { Json } from "./util/util";
import type {
  ClashErrorCause,
  InputErrorCause,
  PointcutErrorCause,
} from "./error";
import type { Atom, Program } from "./lang/syntax";
import type { Config as SetupConfig } from "./setup";
import type { Config as RetroConfig } from "./retro/config";
import type { File, Config as TransConfig } from "./trans/config";
import type { Config as StandardWeaveConfig } from "./weave/standard/config";
import type { Config as FlexibleWeaveConfig } from "./weave/flexible/config";
import type { ExternalConfig as InstrumentConfig } from "./instrument";

export type { Digest, LooseEstreeProgram } from "./trans/config";

export type { Kind as NodeKind, Path as NodePath } from "estree-sentry";

export type {
  Situ,
  GlobalSitu,
  RootLocalSitu as LocalSitu,
  DeepLocalSitu as AranSitu,
} from "./trans/source";

export type {
  ModuleHeader as AranModuleHeader,
  ImportHeader as AranImportHeader,
  ExportHeader as AranExportHeader,
  AggregateHeader as AranAggregateHeader,
  DeclareHeader as AranDeclareHeader,
  Header as AranHeader,
} from "./lang/header";

export type {
  Node as AranNode,
  Program as AranProgram,
  RoutineBlock as AranRoutineBlock,
  SegmentBlock as AranSegmentBlock,
  Statement as AranStatement,
  Effect as AranEffect,
  Expression as AranExpression,
  SyntaxPrimitive as AranSyntaxPrimitive,
  RuntimePrimitive as AranPrimitive,
  IntrinsicRecord as AranIntrinsicRecord,
  RegularIntrinsicRcord as AranRegularIntrinsicRecord,
  AccessorIntrinsicRecord as AranAccessorIntrinsicRecord,
  ExtraIntrinsicRecord as AranExtraIntrinsicRecord,
  Intrinsic as AranIntrinsicName,
  Parameter as AranParameter,
} from "./lang/syntax";

export {
  GeneratorKind as AranGeneratorKind,
  ProgramKind as AranProgramKind,
  ClosureKind as AranClosureKind,
  SegmentKind as AranSegmentKind,
  ControlKind as AranControlKind,
} from "./weave/parametrization";

export type {
  TestKind as AranTestKind,
  Pointcut as StandardPointcut,
  Aspect as StandardAspect,
  Advice as StandardAdvice,
  CompleteAdvice as CompleteStandardAdvice,
} from "./weave/standard/aspect.d.ts";

export type {
  Pointcut as FlexiblePointcut,
  HeterogeneousAspect as HeterogeneousFlexibleAspect,
  HomogeneousAspect as HomogeneousFlexibleAspect,
} from "./weave/flexible/aspect.d.ts";

export type { Json } from "./util/util";

export {
  Atom,
  File,
  InstrumentConfig,
  SetupConfig,
  TransConfig,
  RetroConfig,
  StandardWeaveConfig,
  FlexibleWeaveConfig,
};

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
 * Generates a `estree.Program` that should be executed before executing any
 * instrumented code. In the standalone mode, the setup code is bundled with the
 * instrumented code and this function should not be used.
 * @template global_variable The branded type for global variables.
 * @param conf Setup generation options.
 * @returns The setup script program. Can be passed to an estree code generator
 * such as `astring`.
 * @throws {@link AranInputError} If the configuration is invalid.
 */
export const generateSetup: <global_variable extends string = string>(
  conf?: Partial<SetupConfig<global_variable>>,
) => EstreeScriptProgram<{}>;

///////////////
// Transpile //
///////////////

/**
 * Transpile a JavaScript program to an Aran program.
 * @template hash The branded type for the result of `conf.digest`
 * @template atom The branded types for the leafs of the output program.
 * @template path The type of `file.path`.
 * @param file The parsed JavaScript program to transpile.
 * @param conf Transpilation options.
 * @returns The transpiled aran program along with warnings.
 * @throws {@link AranInputError} If `conf` is invalid or if the top level
 * properties of `file` are invalid.
 * @throws {@link AranSyntaxError} If there is problem with the AST at
 * `file.root` either because there is an early syntax error or because it is
 * not a valid ESTree program.
 */
export const transpile: <
  hash extends string | number = string | number,
  atom extends Atom & { Tag: hash } = Atom & { Tag: hash },
  path = unknown,
>(
  file: Partial<File<path>>,
  conf?: null | undefined | Partial<TransConfig<hash, path>>,
) => Program<atom> & { _aran_warning_array: Warning[] };

///////////
// Weave //
///////////

/**
 * Insert calls to advice functions in an Aran program with the standard API.
 * @template tag The type of node tags.
 * @template arg_atom The branded types for the AST leafs of the input program.
 * @template res_atom The branded types for the AST leafs of the output program.
 * @template global_variable The branded type for global variables.
 * @param root The Aran program to weave.
 * @param conf Standard weaving options.
 * @returns The woven program.
 * @throws {@link AranPointcutError} If there is a problem with the provided
 * pointcut.
 */
export const weaveStandard: <
  tag extends Json = Json,
  arg_atom extends Atom & { Tag: tag } = Atom & { Tag: tag },
  res_atom extends Atom & { Tag: tag } = Atom & { Tag: tag },
  global_variable extends string = string,
>(
  root: Program<arg_atom>,
  conf?:
    | null
    | undefined
    | Partial<StandardWeaveConfig<arg_atom, global_variable>>,
) => Program<res_atom>;

/**
 * Insert calls to advice functions in an Aran program with the flexible API.
 * @template tag The type of node tags.
 * @template arg_atom The branded types for the AST leafs of the input program.
 * @template res_atom The branded types for the AST leafs of the output program.
 * @template global_variable The branded type for global variables.
 * @param root The Aran program to weave.
 * @param conf Flexible weaving options.
 * @returns The woven program.
 * @throws {@link AranPointcutError} If there is a problem with the provided
 * pointcut.
 */
export const weaveFlexible: <
  tag = unknown,
  arg_atom extends Atom & { Tag: tag } = Atom & { Tag: tag },
  res_atom extends Atom & { Tag: tag } = Atom & { Tag: tag },
  global_variable extends string = string,
>(
  root: Program<arg_atom>,
  conf?:
    | null
    | undefined
    | Partial<FlexibleWeaveConfig<arg_atom, global_variable>>,
) => Program<res_atom>;

///////////////
// Retropile //
///////////////

/**
 * Transpile an Aran program back to an ESTree JavaScript program.
 * @param root The Aran program to retropile.
 * @param conf Retropilation options.
 * @returns An ESTree program that can be fed to a estree code generator like
 * `astring`.
 * @throws {@link AranClashError} If there is a clash between Aran variables and
 * the variable in `file.root`.
 */
export const retropile: (
  root: Program<Atom>,
  conf?: null | undefined | Partial<RetroConfig>,
) => EstreeProgram<{}>;

////////////////
// Instrument //
////////////////

/**
 * Instrument a parsed JavaScript program. It chains `transpile`,
 * `weaveStandard` or `weaveFlexible`, and `retropile`.
 * @template hash The type of the result of `conf.digest`.
 * @template atom The branded types for the leafs of the woven program.
 * @template global_variable The branded type for global variables.
 * @template path The type of `file.path`.
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
export const instrument: <
  hash extends string | number = string | number,
  atom extends Atom & { Tag: hash } = Atom & { Tag: hash },
  global_variable extends string = string,
  path = unknown,
>(
  file: Partial<File<path>>,
  conf?:
    | null
    | undefined
    | Partial<InstrumentConfig<atom, global_variable, path>>,
) => EstreeProgram<{}> & {
  warnings: Warning[];
};

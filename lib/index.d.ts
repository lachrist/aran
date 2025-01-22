import type {
  Program as EstreeProgram,
  Kind as EstreeNodeKind,
  Path as EstreeNodePath,
  SyntaxErrorCause,
} from "estree-sentry";
import type { Warning } from "./trans/prelude/warning";
import type { Json } from "./util/util";
import type {
  ClashErrorCause,
  InputErrorCause,
  PointcutErrorCause,
} from "./error";
import type {
  ModuleHeader,
  ImportHeader,
  ExportHeader,
  AggregateHeader,
  DeclareHeader,
  Header,
} from "./lang/header";
import type {
  Atom,
  Node,
  Program,
  RoutineBlock,
  SegmentBlock,
  Statement,
  Effect,
  Expression,
  SyntaxPrimitive,
  RuntimePrimitive as Primitive,
  IntrinsicRecord,
  RegularIntrinsicRcord,
  AccessorIntrinsicRecord,
  ExtraIntrinsicRecord,
  Intrinsic,
  Parameter,
} from "./lang/syntax";
import type { Config as SetupConfig } from "./setup";
import type { Config as RetroConfig } from "./retro/config";
import type { File, Config as TransConfig } from "./trans/config";
import type { Config as StandardWeaveConfig } from "./weave/standard/config";
import type { Config as FlexibleWeaveConfig } from "./weave/flexible/config";
import type { Config as InstrumentConfig } from "./instrument";
import type { Digest, LooseEstreeProgram } from "./trans/config";
import type {
  Situ,
  GlobalSitu,
  RootLocalSitu,
  DeepLocalSitu,
} from "./trans/source";
import {
  GeneratorKind,
  ProgramKind,
  ClosureKind,
  SegmentKind,
  ControlKind,
} from "./weave/parametrization";
import type {
  TestKind,
  AspectTyping as StandardAspectTyping,
  Pointcut as StandardPointcut,
  Aspect as StandardAspect,
  Advice as StandardAdvice,
} from "./weave/standard/aspect";
import type {
  AspectTyping as FlexibleAspectTyping,
  AspectKind as FlexibleAspectKind,
  Aspect as FlexibleAspect,
  Pointcut as FlexiblePointcut,
  Advice as FlexibleAdvice,
} from "./weave/flexible/aspect";

export {
  // Util //
  Json,
  // Config //
  SetupConfig,
  RetroConfig,
  TransConfig,
  StandardWeaveConfig,
  FlexibleWeaveConfig,
  InstrumentConfig,
  // Estree //
  EstreeProgram,
  EstreeNodeKind,
  EstreeNodePath,
  LooseEstreeProgram,
  // Error //
  Warning,
  SyntaxErrorCause,
  ClashErrorCause,
  InputErrorCause,
  PointcutErrorCause,
  Digest,
  Situ,
  GlobalSitu,
  RootLocalSitu,
  DeepLocalSitu,
  // Syntax //
  Atom,
  ModuleHeader,
  ImportHeader,
  ExportHeader,
  AggregateHeader,
  DeclareHeader,
  Header,
  Node,
  Program,
  RoutineBlock,
  SegmentBlock,
  Statement,
  Effect,
  Expression,
  SyntaxPrimitive,
  Primitive,
  IntrinsicRecord,
  RegularIntrinsicRcord,
  AccessorIntrinsicRecord,
  ExtraIntrinsicRecord,
  Intrinsic,
  Parameter,
  // Aspect //
  FlexibleAspectKind,
  GeneratorKind,
  ProgramKind,
  ClosureKind,
  SegmentKind,
  ControlKind,
  TestKind,
  StandardPointcut,
  StandardAspect,
  StandardAdvice,
  StandardAspectTyping,
  FlexibleAspectTyping,
  FlexiblePointcut,
  FlexibleAspect,
  FlexibleAdvice,
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
 * Signals a problem within the syntax of the target code.
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
 * @param conf Setup generation options.
 * @returns The setup script program. Can be passed to an estree code generator
 * such as `astring`.
 * @throws {@link AranInputError} If the configuration is invalid.
 */
export const generateSetup: (
  conf?: Partial<SetupConfig<string>>,
) => EstreeProgram<null> & { sourceType: "script" };

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
) => Program<atom> & { warnings: Warning[] };

///////////
// Weave //
///////////

/**
 * Insert calls to advice functions in an Aran program with the standard API.
 * @template tag The type of node tags.
 * @template arg_atom The branded types for the AST leafs of the input program.
 * @template res_atom The branded types for the AST leafs of the output program.
 * @param root The Aran program to weave.
 * @param conf Standard weaving options.
 * @returns The woven program.
 * @throws {@link AranInputError} If `conf` or `root` are invalid.
 * @throws {@link AranPointcutError} If there is a problem with the provided
 * pointcut.
 */
export const weaveStandard: <
  tag extends Json = Json,
  arg_atom extends Atom & { Tag: tag } = Atom & { Tag: tag },
  res_atom extends Atom & { Tag: tag } = Atom & { Tag: tag },
>(
  root: Program<arg_atom>,
  conf?:
    | null
    | undefined
    | Partial<StandardWeaveConfig<Json, arg_atom, string>>,
) => Program<res_atom>;

/**
 * Insert calls to advice functions in an Aran program with the flexible API.
 * @template tag The type of node tags.
 * @template arg_atom The branded types for the AST leafs of the input program.
 * @template res_atom The branded types for the AST leafs of the output program.
 * @param root The Aran program to weave.
 * @param conf Flexible weaving options.
 * @returns The woven program.
 * @throws {@link AranInputError} If `conf` or `root` are invalid.
 * @throws {@link AranPointcutError} If there is a problem with the provided
 * pointcut.
 */
export const weaveFlexible: <
  tag = unknown,
  arg_atom extends Atom & { Tag: tag } = Atom & { Tag: tag },
  res_atom extends Atom & { Tag: tag } = Atom & { Tag: tag },
>(
  root: Program<arg_atom>,
  conf?:
    | null
    | undefined
    | Partial<FlexibleWeaveConfig<Json, arg_atom, string, Json[]>>,
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
 * @throws {@link AranInputError} If `conf` or `root` are invalid.
 * @throws {@link AranPointcutError} If there is a problem with the provided
 * pointcut.
 * @throws {@link AranClashError} If there is a clash between Aran variables and
 * the variable in `file.root`.
 */
export const retropile: (
  root: Program<Atom>,
  conf?: null | undefined | Partial<RetroConfig>,
) => EstreeProgram<null>;

////////////////
// Instrument //
////////////////

/**
 * Instrument a parsed JavaScript program. It chains `transpile`,
 * `weaveStandard` or `weaveFlexible`, and `retropile`.
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
 * @throws {@link AranPointcutError} If there is a problem with the provided
 * pointcut.
 * @throws {@link AranClashError} If there is a clash between Aran variables and
 * the variable in `file.root`.
 */
export const instrument: <path = string>(
  file: Partial<File<path>>,
  conf?:
    | null
    | undefined
    | Partial<
        InstrumentConfig<Json, Atom & { Tag: string | number }, string, path>
      >,
) => EstreeProgram<{}> & {
  warnings: Warning[];
};

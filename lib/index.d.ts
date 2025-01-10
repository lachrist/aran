import type {
  Program as EstreeProgram,
  ScriptProgram as EstreeScriptProgram,
  SyntaxErrorCause,
} from "estree-sentry";
import type { RawWarning } from "./trans/prelude/warning";
import type { Json } from "./util/util";
import type {
  ClashErrorCause,
  InputErrorCause,
  PointcutErrorCause,
} from "./error";
import type { Atom, Parameter, Program } from "./lang/syntax";
import type {
  ControlKind,
  ClosureKind,
  SegmentKind,
  ProgramKind,
} from "./weave/parametrization";
import type { ExternalConfig as SetupConfig } from "./setup";
import type { ExternalConfig as RetroConfig } from "./retro/config";
import type { File as TransFile, Config as TransConfig } from "./trans/config";
import type { ExternalConfig as StandardWeaveConfig } from "./weave/standard/config";
import type { Config as FlexibleWeaveConfig } from "./weave/flexible/config";
import type { ExternalConfig as InstrumentConfig } from "./instrument";

export type { Kind as NodeKind, Path as NodePath } from "estree-sentry";

export type {
  Situ,
  GlobalSitu,
  RootLocalSitu as LocalSitu,
  DeepLocalSitu as AranSitu,
} from "./trans/source";

export type {
  Program as Program,
  RoutineBlock as AranRoutineBlock,
  SegmentBlock as AranSegmentBlock,
  Statement as AranStatement,
  Effect as AranEffect,
  Expression as AranExpression,
  Primitive as AranPrimitive,
  RuntimePrimitive as AranRuntimePrimitve,
  IntrinsicRecord as AranIntrinsicRecord,
  RegularIntrinsicRcord as AranRegularIntrinsicRecord,
  AccessorIntrinsicRecord as AranAccessorIntrinsicRecord,
  ExtraIntrinsicRecord as AranExtraIntrinsicRecord,
  Intrinsic as AranIntrinsicName,
  Parameter as AranParameter,
} from "./lang/syntax";

export {
  ProgramKind as ProgramKind,
  ClosureKind as AranClosureKind,
  SegmentKind as AranSegmentKind,
  ControlKind as AranControlKind,
} from "./weave/parametrization";

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

export type { Json } from "./util/util";

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
 * @param conf The configuration of the setup program.
 * @returns The setup script program. Can be passed to an estree code generator
 * such as `astring`.
 * @throws {@link AranInputError} If the configuration is invalid.
 */
export const generateSetup: (
  conf?: Partial<SetupConfig>,
) => EstreeScriptProgram<{}>;

///////////////
// Transpile //
///////////////

/**
 * Transpile a JavaScript program to an Aran program.
 * @template P The type of `file.path`.
 * @template H The type of node hashes as returned by `conf.digest`.
 * @param file The parsed JavaScript program to transpile.
 * @param conf Transpiling options.
 * @returns The transpiled aran program along with warnings.
 * @throws {@link AranInputError} If `conf` is invalid or if the top level
 * properties of `file` are invalid.
 * @throws {@link AranSyntaxError} If there is problem with the AST at
 * `file.root` either because there is an early syntax error or because it is
 * not a valid ESTree program.
 */
export const transpile: <
  P,
  H extends number | string,
  A extends Atom & { Tag: H },
>(
  file: Partial<TransFile<P>>,
  conf?: null | undefined | Partial<TransConfig<P, H>>,
) => Program<A> & { _aran_warning_array: RawWarning[] };

///////////
// Weave //
///////////

/**
 * Insert calls to advice functions in an Aran program with the standard API.
 * @template T The type of node tags.
 * @param root The Aran program to weave.
 * @param conf Weaving configuration object.
 * @returns The woven program.
 */
export const weaveStandard: <T extends Json, A extends Atom & { Tag: T }>(
  root: Program<Atom & { Tag: T }>,
  conf?: null | undefined | Partial<StandardWeaveConfig<T>>,
) => Program<A>;

/**
 * Insert calls to advice functions in an Aran program with the flexible API.
 * @template T The type of node tags.
 * @param root The Aran program to weave.
 * @param conf Weaving configuration object.
 * @returns The woven program.
 */
export const weaveFlexible: <
  T,
  A1 extends Atom & { Tag: T },
  A2 extends Atom & { Tag: T },
>(
  root: Program<A1>,
  conf?: null | undefined | Partial<FlexibleWeaveConfig<A1>>,
) => Program<A2>;

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
export const instrument: <
  P,
  H extends number | string,
  A extends Atom & { Tag: H },
>(
  file: Partial<TransFile<P>>,
  conf?: null | undefined | Partial<InstrumentConfig<P, H, A>>,
) => EstreeProgram<{}> & {
  _aran_warning_array: RawWarning[];
};

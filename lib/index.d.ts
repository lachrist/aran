export type {
  Variable as EstreeVariable,
  Label as EstreeLabel,
  Specifier as EstreeSpecifier,
  Source as EstreeSource,
  Program as EstreeProgram,
  ScriptProgram as EstreeScriptProgram,
  ModuleProgram as EstreeModuleProgram,
  Statement as EstreeStatement,
  Expression as EstreeExpression,
} from "./estree.d.ts";

export type { Path } from "./path.d.ts";

export type {
  EarlySyntaxError,
  Source,
  GlobalSitu,
  DeepLocalSitu,
  RootLocalSitu,
} from "./source.js";

export type {
  Parameter,
  Intrinsic,
  IntrinsicRecord,
  Primitive,
  RuntimePrimitive,
} from "./lang.d.ts";

export type { Json } from "./json.d.ts";

export type {
  Warning,
  AranDuplicateCutError,
  AranExecError,
  AranIllegalInputError,
  AranIllegalSyntaxError,
  AranTypeError,
  AranVariableClashError,
  AranWarningError,
} from "./report.d.ts";

export type {
  ArgVariable as Variable,
  Label as Label,
  ArgProgram as Program,
  ArgControlBlock as ControlBlock,
  ArgRoutineBlock as RoutineBlock,
  ArgStatement as Statement,
  ArgEffect as Effect,
  ArgExpression as Expression,
} from "./weave/atom.d.ts";

export type {
  Valuation as StandardValuation,
  Frame as StandardFrame,
  PreciseFrame as StandardPreciseFrame,
  Kind as StandardKind,
  Aspect as StandardAspect,
  Advice as StandardAdvice,
  Pointcut as StandardPointcut,
  ObjectPointcut as StandardObjectPointcut,
  ArrayPointcut as StandardIterablePointcut,
} from "./weave/standard/aspect.d.ts";

export type {
  ProgramKind,
  ClosureKind,
  ControlKind,
  BlockKind,
} from "./weave/parametrization.d.ts";

export type {
  AdviceElement as FlexibleAdviceElement,
  Pointcut as FlexiblePointcut,
  Aspect as FlexibleAspect,
  HomogeneousAspect as HomogeneousFlexibleAspect,
  HeterogeneousAspect as HeterogeneousFlexibleAspect,
} from "./weave/flexible/aspect.d.ts";

export type { Config } from "./config.d.ts";

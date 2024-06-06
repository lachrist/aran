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
  Context,
  GlobalContext,
  DeepLocalContext,
  RootLocalContext,
} from "./source.js";

export type {
  Intrinsic,
  IntrinsicRecord,
  Primitive,
  RuntimePrimitive,
} from "./lang.d.ts";

export type { Json } from "./json.d.ts";

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
  UnknownAspect as UnknownStandardAspect,
  Aspect as StandardAspect,
  Advice as StandardAdvice,
  Pointcut as StandardPointcut,
} from "./weave/standard/aspect.d.ts";

export type {
  AdviceElement as FlexibleAdviceElement,
  Pointcut as FlexiblePointcut,
  UnknownAspect as UnknownFlexibleAspect,
  HomogeneousAspect as HomogeneousAspectFlexibleAspect,
  HeterogeneousAspect as HeterogeneousFlexibleAspect,
} from "./weave/flexible/aspect.d.ts";

export type { Config } from "./config.d.ts";

export type {
  Variable as EstreeVariable,
  Label as EstreeLabel,
  Specifier as EstreeSpecifier,
  Source as EstreeSource,
  Program as EstreeProgram,
  Statement as EstreeStatement,
  Expression as EstreeExpression,
} from "./estree.d.ts";

export type { Intrinsic, Primitive, RuntimePrimitive } from "./lang.d.ts";

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

export type { AspectTyping as StandardAspect } from "./weave/standard/aspect.d.ts";

export type {
  HomogeneousAspect as HomogeneousAspectFlexibleAspect,
  HeterogeneousAspect as HeterogeneousFlexibleAspect,
} from "./weave/flexible/aspect.d.ts";

export type { Config } from "./config.d.ts";

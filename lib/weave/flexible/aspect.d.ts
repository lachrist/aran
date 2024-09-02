import type { DeepLocalSitu } from "../../source";
import type { Variable as EstreeVariable } from "../../estree";
import type {
  ArgVariable as Variable,
  ArgNode as Node,
  ArgProgram as Program,
  ArgControlBlock as ControlBlock,
  ArgRoutineBlock as RoutineBlock,
  ArgStatement as Statement,
  ArgEffect as Effect,
  ArgExpression as Expression,
} from "../atom";
import type { Parameter } from "../../lang";
import type { Json } from "../../json";
import type { ValueOf } from "../../util";

export {
  Variable,
  Node,
  Program,
  ControlBlock,
  RoutineBlock,
  Statement,
  Effect,
  Expression,
};

export type GlobalAdviceVariable = string;

export type Block = ControlBlock | RoutineBlock;

export type GenericPointcut<point extends Json[], node extends Node> = (
  node: node,
  parent: Node,
  root: Program,
) => undefined | null | point;

/**
 * The flexible weaving API expects each advice function to be a global value.
 * It is more complex to use than the standard weaving API but it let the user
 * define the static information provided to the advice functions. Unlike the
 * standard weaving API, each join point can be cut multiple times. NB: the join
 * points `eval@before`, `apply@around` and `construct@around` can only be cut
 * once. The join points of the flexible weaving API are very similar to the
 * join points of the standard API.
 */
export type AspectTyping<state, value, point extends Json[]> = {
  // block //
  "block@setup": {
    pointcut: GenericPointcut<point, Block>;
    advice: (parent: state, ...point: point) => state;
  };
  "block@before": {
    pointcut: GenericPointcut<point, Block>;
    advice: (state: state, ...point: point) => void;
  };
  "block@declaration": {
    pointcut: GenericPointcut<point, Block>;
    advice: (
      state: state,
      frame: { [variable in Variable | Parameter]: value },
      ...point: point
    ) => void;
  };
  "block@declaration-overwrite": {
    pointcut: GenericPointcut<point, Block>;
    advice: (
      state: state,
      frame: { [K in Variable | Parameter]: value },
      ...point: point
    ) => { [K in Variable | Parameter]: value };
  };
  "program-block@after": {
    pointcut: GenericPointcut<point, RoutineBlock>;
    advice: (state: state, value: value, ...point: point) => value;
  };
  "closure-block@after": {
    pointcut: GenericPointcut<point, RoutineBlock>;
    advice: (state: state, value: value, ...point: point) => value;
  };
  "control-block@after": {
    pointcut: GenericPointcut<point, ControlBlock>;
    advice: (state: state, ...point: point) => void;
  };
  "block@throwing": {
    pointcut: GenericPointcut<point, Block>;
    advice: (state: state, error: value, ...point: point) => value;
  };
  "block@teardown": {
    pointcut: GenericPointcut<point, Block>;
    advice: (state: state, ...point: point) => void;
  };
  // statement //
  "statement@before": {
    pointcut: GenericPointcut<point, Statement>;
    advice: (state: state, ...point: point) => void;
  };
  "statement@after": {
    pointcut: GenericPointcut<point, Statement>;
    advice: (state: state, ...point: point) => void;
  };
  // effect //
  "effect@before": {
    pointcut: GenericPointcut<point, Effect>;
    advice: (state: state, ...point: point) => void;
  };
  "effect@after": {
    pointcut: GenericPointcut<point, Effect>;
    advice: (state: state, ...point: point) => void;
  };
  // expression //
  "expression@before": {
    pointcut: GenericPointcut<point, Expression>;
    advice: (state: state, ...point: point) => void;
  };
  "expression@after": {
    pointcut: GenericPointcut<point, Expression>;
    advice: (state: state, result: value, ...point: point) => value;
  };
  // eval //
  "eval@before": {
    pointcut: GenericPointcut<point, Expression & { type: "EvalExpression" }>;
    advice: (
      state: state,
      code: value,
      situ: DeepLocalSitu,
      ...point: point
    ) => value;
  };
  // apply - construct //
  "apply@around": {
    pointcut: GenericPointcut<point, Expression & { type: "ApplyExpression" }>;
    advice: (
      state: state,
      callee: value,
      this_: value,
      arguments_: value[],
      ...point: point
    ) => value;
  };
  "construct@around": {
    pointcut: GenericPointcut<
      point,
      Expression & { type: "ConstructExpression" }
    >;
    advice: (
      state: state,
      callee: value,
      arguments_: value[],
      ...point: point
    ) => value;
  };
};

export type AspectKind = keyof AspectTyping<never, never, never>;

export type AspectElement<state, value, point extends Json[]> = ValueOf<{
  [key in AspectKind]: {
    kind: key;
    pointcut: AspectTyping<state, value, point>[key]["pointcut"];
    advice: AspectTyping<state, value, point>[key]["advice"];
  };
}>;

export type PointcutEntry<kind extends AspectKind> = [
  EstreeVariable,
  {
    kind: kind;
    pointcut: AspectTyping<never, never, Json[]>[kind]["pointcut"];
  },
];

export type AdviceElement<state, value, point extends Json[]> = ValueOf<{
  [kind in AspectKind]: {
    kind: kind;
    advice: AspectTyping<state, value, point>[kind]["advice"];
  };
}>;

export type HomogeneousAdvice<
  state,
  value,
  point extends Json[],
> = AdviceElement<state, value, point>[];

export type Pointcut = {
  [variable: GlobalAdviceVariable]: ValueOf<{
    [kind in AspectKind]: {
      kind: kind;
      pointcut: AspectTyping<never, never, Json[]>[kind]["pointcut"];
    };
  }>;
};

export type OptimalPointcut = {
  [kind in AspectKind]: [
    EstreeVariable,
    AspectTyping<never, never, Json[]>[kind]["pointcut"],
  ][];
};

export type OptimalPointcutEntry<kind extends AspectKind> = [
  EstreeVariable,
  AspectTyping<never, never, Json[]>[kind]["pointcut"],
];

export type HomogeneousAspect<state, value, point extends Json[]> = {
  [variable: GlobalAdviceVariable]: AspectElement<state, value, point>;
};

export type HeterogeneousAspect<
  state,
  value,
  point extends { [variable: GlobalAdviceVariable]: Json[] },
> = {
  [variable in keyof point]: AspectElement<state, value, point[variable]>;
};

export type Aspect<state, value> = {
  [variable: GlobalAdviceVariable]: AspectElement<state, value, any>;
};

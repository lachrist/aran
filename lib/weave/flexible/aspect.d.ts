import type { DeepLocalContext } from "../../program";
import type { Variable as EstreeVariable } from "../../estree";
import {
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

type ValueOf<record> = record[keyof record];

export type GenericPointcut<point extends Json[], node extends Node> = (
  node: node,
  parent: Node,
  root: Program,
) => undefined | null | point;

export type AspectTyping<value, state, point extends Json[]> = {
  "block@setup": {
    pointcut: GenericPointcut<point, ControlBlock | RoutineBlock>;
    advice: (parent: state, ...point: point) => state;
  };
  "block@frame": {
    pointcut: GenericPointcut<point, ControlBlock | RoutineBlock>;
    advice: (
      state: state,
      frame: { [variable in Variable | Parameter]: value },
      ...point: point
    ) => void;
  };
  "block@overframe": {
    pointcut: GenericPointcut<point, ControlBlock | RoutineBlock>;
    advice: (
      state: state,
      frame: { [K in Variable | Parameter]: value },
      ...point: point
    ) => { [K in Variable | Parameter]: value };
  };
  "block@before": {
    pointcut: GenericPointcut<point, ControlBlock | RoutineBlock>;
    advice: (state: state, ...point: point) => void;
  };
  "block@after": {
    pointcut: GenericPointcut<point, ControlBlock | RoutineBlock>;
    advice: (state: state, ...point: point) => void;
  };
  "block@failure": {
    pointcut: GenericPointcut<point, ControlBlock | RoutineBlock>;
    advice: (state: state, error: value, ...point: point) => value;
  };
  "block@teardown": {
    pointcut: GenericPointcut<point, ControlBlock | RoutineBlock>;
    advice: (state: state, ...point: point) => void;
  };
  "statement@before": {
    pointcut: GenericPointcut<point, Statement>;
    advice: (state: state, ...point: point) => void;
  };
  "statement@after": {
    pointcut: GenericPointcut<point, Statement>;
    advice: (state: state, ...point: point) => void;
  };
  "effect@before": {
    pointcut: GenericPointcut<point, Effect>;
    advice: (state: state, ...point: point) => void;
  };
  "effect@after": {
    pointcut: GenericPointcut<point, Effect>;
    advice: (state: state, ...point: point) => void;
  };
  "expression@before": {
    pointcut: GenericPointcut<point, Expression>;
    advice: (state: state, ...point: point) => void;
  };
  "expression@after": {
    pointcut: GenericPointcut<point, Expression>;
    advice: (state: state, result: value, ...point: point) => value;
  };
  "eval@before": {
    pointcut: GenericPointcut<point, Expression & { type: "EvalExpression" }>;
    advice: (
      state: state,
      code: value,
      context: DeepLocalContext,
      ...point: point
    ) => value;
  };
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

export type AspectElement<value, state, point extends Json[]> = ValueOf<{
  [key in AspectKind]: {
    kind: key;
    pointcut: AspectTyping<value, state, point>[key]["pointcut"];
    advice: AspectTyping<value, state, point>[key]["advice"];
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

export type Pointcut = {
  [advice in EstreeVariable]: ValueOf<{
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

export type HomogeneousAspect<
  subset extends EstreeVariable,
  state,
  value,
  point extends Json[],
> = {
  [variable in subset]: AspectElement<state, value, point>;
};

export type HeterogeneousAspect<
  subset extends EstreeVariable,
  state,
  value,
  point extends { [key in subset]: Json[] },
> = {
  [key in subset]: AspectElement<state, value, point[key]>;
};

export type UnknownAspect = {
  [variable in EstreeVariable]?: AspectElement<unknown, unknown, Json[]>;
};

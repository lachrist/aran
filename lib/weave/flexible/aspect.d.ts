import type { DeepLocalSitu } from "../../source";
import type { VariableName } from "estree-sentry";
import type {
  ArgVariable as Variable,
  GenNode as Node,
  GenProgram as Program,
  GenSegmentBlock as SegmentBlock,
  GenRoutineBlock as RoutineBlock,
  GenStatement as Statement,
  GenEffect as Effect,
  GenExpression as Expression,
} from "../atom";
import type { Parameter } from "../../lang/syntax";
import type { Json } from "../../util/util";
import type { ValueOf } from "../../util/util";
import type { Hash } from "../../hash";

export {
  Variable,
  Node,
  Program,
  SegmentBlock,
  RoutineBlock,
  Statement,
  Effect,
  Expression,
};

export type GlobalAdviceVariable = string;

export type Block<hash> = SegmentBlock<hash> | RoutineBlock<hash>;

export type GenericPointcut<
  hash,
  point extends Json[],
  node extends Node<hash>,
> = (
  node: node,
  parent: Node<hash>,
  root: Program<hash>,
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
export type AspectTyping<hash, state, value, point extends Json[]> = {
  // block //
  "block@setup": {
    pointcut: GenericPointcut<hash, point, Block<hash>>;
    advice: (parent: state, ...point: point) => state;
  };
  "block@before": {
    pointcut: GenericPointcut<hash, point, Block<hash>>;
    advice: (state: state, ...point: point) => void;
  };
  "block@declaration": {
    pointcut: GenericPointcut<hash, point, Block<hash>>;
    advice: (
      state: state,
      frame: { [variable in Variable | Parameter]: value },
      ...point: point
    ) => void;
  };
  "block@declaration-overwrite": {
    pointcut: GenericPointcut<hash, point, Block<hash>>;
    advice: (
      state: state,
      frame: { [K in Variable | Parameter]: value },
      ...point: point
    ) => { [K in Variable | Parameter]: value };
  };
  "program-block@after": {
    pointcut: GenericPointcut<hash, point, RoutineBlock<hash>>;
    advice: (state: state, value: value, ...point: point) => value;
  };
  "closure-block@after": {
    pointcut: GenericPointcut<hash, point, RoutineBlock<hash>>;
    advice: (state: state, value: value, ...point: point) => value;
  };
  "segment-block@after": {
    pointcut: GenericPointcut<hash, point, SegmentBlock<hash>>;
    advice: (state: state, ...point: point) => void;
  };
  "block@throwing": {
    pointcut: GenericPointcut<hash, point, Block<hash>>;
    advice: (state: state, error: value, ...point: point) => value;
  };
  "block@teardown": {
    pointcut: GenericPointcut<hash, point, Block<hash>>;
    advice: (state: state, ...point: point) => void;
  };
  // statement //
  "statement@before": {
    pointcut: GenericPointcut<hash, point, Statement<hash>>;
    advice: (state: state, ...point: point) => void;
  };
  "statement@after": {
    pointcut: GenericPointcut<hash, point, Statement<hash>>;
    advice: (state: state, ...point: point) => void;
  };
  // effect //
  "effect@before": {
    pointcut: GenericPointcut<hash, point, Effect<hash>>;
    advice: (state: state, ...point: point) => void;
  };
  "effect@after": {
    pointcut: GenericPointcut<hash, point, Effect<hash>>;
    advice: (state: state, ...point: point) => void;
  };
  // expression //
  "expression@before": {
    pointcut: GenericPointcut<hash, point, Expression<hash>>;
    advice: (state: state, ...point: point) => void;
  };
  "expression@after": {
    pointcut: GenericPointcut<hash, point, Expression<hash>>;
    advice: (state: state, result: value, ...point: point) => value;
  };
  // eval //
  "eval@before": {
    pointcut: GenericPointcut<
      hash,
      point,
      Expression<hash> & { type: "EvalExpression" }
    >;
    advice: (
      state: state,
      code: value,
      situ: DeepLocalSitu,
      ...point: point
    ) => value;
  };
  // apply - construct //
  "apply@around": {
    pointcut: GenericPointcut<
      hash,
      point,
      Expression<hash> & { type: "ApplyExpression" }
    >;
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
      hash,
      point,
      Expression<hash> & { type: "ConstructExpression" }
    >;
    advice: (
      state: state,
      callee: value,
      arguments_: value[],
      ...point: point
    ) => value;
  };
};

export type AspectKind = keyof AspectTyping<never, never, never, never>;

export type AspectElement<hash, state, value, point extends Json[]> = ValueOf<{
  [key in AspectKind]: {
    kind: key;
    pointcut: AspectTyping<hash, state, value, point>[key]["pointcut"];
    advice: AspectTyping<hash, state, value, point>[key]["advice"];
  };
}>;

export type PointcutEntry<hash, kind extends AspectKind> = [
  VariableName,
  {
    kind: kind;
    pointcut: AspectTyping<hash, never, never, Json[]>[kind]["pointcut"];
  },
];

export type AdviceElement<hash, state, value, point extends Json[]> = ValueOf<{
  [kind in AspectKind]: {
    kind: kind;
    advice: AspectTyping<hash, state, value, point>[kind]["advice"];
  };
}>;

export type HomogeneousAdvice<
  hash,
  state,
  value,
  point extends Json[],
> = AdviceElement<hash, state, value, point>[];

export type Pointcut<hash> = {
  [variable: GlobalAdviceVariable]: ValueOf<{
    [kind in AspectKind]: {
      kind: kind;
      pointcut: AspectTyping<hash, never, never, Json[]>[kind]["pointcut"];
    };
  }>;
};

export type OptimalPointcut = {
  [kind in AspectKind]: [
    VariableName,
    AspectTyping<Hash, never, never, Json[]>[kind]["pointcut"],
  ][];
};

export type OptimalPointcutEntry<kind extends AspectKind> = [
  VariableName,
  AspectTyping<Hash, never, never, Json[]>[kind]["pointcut"],
];

export type HomogeneousAspect<hash, state, value, point extends Json[]> = {
  [variable: GlobalAdviceVariable]: AspectElement<hash, state, value, point>;
};

export type HeterogeneousAspect<
  hash,
  state,
  value,
  point extends { [variable: GlobalAdviceVariable]: Json[] },
> = {
  [variable in keyof point]: AspectElement<hash, state, value, point[variable]>;
};

export type Aspect<hash, state, value> = {
  [variable: GlobalAdviceVariable]: AspectElement<hash, state, value, any>;
};

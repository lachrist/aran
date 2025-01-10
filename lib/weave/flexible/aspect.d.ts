import type { DeepLocalSitu } from "../../trans/source";
import type { VariableName } from "estree-sentry";
import type {
  Atom,
  Node,
  Parameter,
  Program,
  RoutineBlock,
  SegmentBlock,
  Statement,
  Effect,
  Expression,
} from "../../lang/syntax";
import type { Json } from "../../util/util";
import type { ValueOf } from "../../util/util";
import type { ArgAtom } from "../atom";

export type GlobalAdviceVariable = string;

export type Block<A extends Atom> = SegmentBlock<A> | RoutineBlock<A>;

export type GenericPointcut<
  atom extends Atom,
  point extends Json[],
  node extends Node<atom>,
> = (
  node: node,
  parent: Node<atom>,
  root: Program<atom>,
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
export type AspectTyping<
  atom extends Atom,
  state,
  value,
  point extends Json[],
> = {
  // block //
  "block@setup": {
    pointcut: GenericPointcut<atom, point, Block<atom>>;
    advice: (parent: state, ...point: point) => state;
  };
  "block@before": {
    pointcut: GenericPointcut<atom, point, Block<atom>>;
    advice: (state: state, ...point: point) => void;
  };
  "block@declaration": {
    pointcut: GenericPointcut<atom, point, Block<atom>>;
    advice: (
      state: state,
      frame: { [variable in atom["Variable"] | Parameter]: value },
      ...point: point
    ) => void;
  };
  "block@declaration-overwrite": {
    pointcut: GenericPointcut<atom, point, Block<atom>>;
    advice: (
      state: state,
      frame: { [K in atom["Variable"] | Parameter]: value },
      ...point: point
    ) => { [K in atom["Variable"] | Parameter]: value };
  };
  "program-block@after": {
    pointcut: GenericPointcut<atom, point, RoutineBlock<atom>>;
    advice: (state: state, value: value, ...point: point) => value;
  };
  "closure-block@after": {
    pointcut: GenericPointcut<atom, point, RoutineBlock<atom>>;
    advice: (state: state, value: value, ...point: point) => value;
  };
  "segment-block@after": {
    pointcut: GenericPointcut<atom, point, SegmentBlock<atom>>;
    advice: (state: state, ...point: point) => void;
  };
  "block@throwing": {
    pointcut: GenericPointcut<atom, point, Block<atom>>;
    advice: (state: state, error: value, ...point: point) => value;
  };
  "block@teardown": {
    pointcut: GenericPointcut<atom, point, Block<atom>>;
    advice: (state: state, ...point: point) => void;
  };
  // statement //
  "statement@before": {
    pointcut: GenericPointcut<atom, point, Statement<atom>>;
    advice: (state: state, ...point: point) => void;
  };
  "statement@after": {
    pointcut: GenericPointcut<atom, point, Statement<atom>>;
    advice: (state: state, ...point: point) => void;
  };
  // effect //
  "effect@before": {
    pointcut: GenericPointcut<atom, point, Effect<atom>>;
    advice: (state: state, ...point: point) => void;
  };
  "effect@after": {
    pointcut: GenericPointcut<atom, point, Effect<atom>>;
    advice: (state: state, ...point: point) => void;
  };
  // expression //
  "expression@before": {
    pointcut: GenericPointcut<atom, point, Expression<atom>>;
    advice: (state: state, ...point: point) => void;
  };
  "expression@after": {
    pointcut: GenericPointcut<atom, point, Expression<atom>>;
    advice: (state: state, result: value, ...point: point) => value;
  };
  // eval //
  "eval@before": {
    pointcut: GenericPointcut<
      atom,
      point,
      Expression<atom> & { type: "EvalExpression" }
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
      atom,
      point,
      Expression<atom> & { type: "ApplyExpression" }
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
      atom,
      point,
      Expression<atom> & { type: "ConstructExpression" }
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

export type AspectElement<
  atom extends Atom,
  state,
  value,
  point extends Json[],
> = ValueOf<{
  [key in AspectKind]: {
    kind: key;
    pointcut: AspectTyping<atom, state, value, point>[key]["pointcut"];
    advice: AspectTyping<atom, state, value, point>[key]["advice"];
  };
}>;

export type PointcutEntry<atom extends Atom, kind extends AspectKind> = [
  VariableName,
  {
    kind: kind;
    pointcut: AspectTyping<atom, never, never, Json[]>[kind]["pointcut"];
  },
];

export type InternalPointcutEntry = PointcutEntry<ArgAtom, AspectKind>;

export type AdviceElement<
  atom extends Atom,
  state,
  value,
  point extends Json[],
> = ValueOf<{
  [kind in AspectKind]: {
    kind: kind;
    advice: AspectTyping<atom, state, value, point>[kind]["advice"];
  };
}>;

export type HomogeneousAdvice<
  atom extends Atom,
  state,
  value,
  point extends Json[],
> = AdviceElement<atom, state, value, point>[];

export type Pointcut<atom extends Atom> = {
  [variable: GlobalAdviceVariable]: ValueOf<{
    [kind in AspectKind]: {
      kind: kind;
      pointcut: AspectTyping<atom, never, never, Json[]>[kind]["pointcut"];
    };
  }>;
};

export type InternalPointcut = Pointcut<ArgAtom>;

export type OptimalPointcut = {
  [kind in AspectKind]: [
    VariableName,
    AspectTyping<ArgAtom, never, never, Json[]>[kind]["pointcut"],
  ][];
};

export type OptimalPointcutEntry<kind extends AspectKind> = [
  VariableName,
  AspectTyping<ArgAtom, never, never, Json[]>[kind]["pointcut"],
];

export type HomogeneousAspect<
  atom extends Atom,
  state,
  value,
  point extends Json[],
> = {
  [variable: GlobalAdviceVariable]: AspectElement<atom, state, value, point>;
};

export type HeterogeneousAspect<
  atom extends Atom,
  state,
  value,
  point extends { [variable: GlobalAdviceVariable]: Json[] },
> = {
  [variable in keyof point]: AspectElement<atom, state, value, point[variable]>;
};

export type Aspect<atom extends Atom, state, value> = {
  [variable: GlobalAdviceVariable]: AspectElement<atom, state, value, any>;
};

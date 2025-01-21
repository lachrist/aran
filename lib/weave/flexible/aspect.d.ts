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
    advice: (state: state, code: value, ...point: point) => value;
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

export type Aspect<
  atom extends Atom,
  state = unknown,
  value = unknown,
  point extends Json[] = Json[],
  javascript_identifier extends string = string,
> = {
  [name in javascript_identifier]: ValueOf<{
    [kind in AspectKind]: {
      kind: kind;
      pointcut: AspectTyping<atom, state, value, point>[kind]["pointcut"];
      advice: AspectTyping<atom, state, value, point>[kind]["advice"];
    };
  }>;
};

export type Pointcut<
  atom extends Atom,
  point extends Json[] = Json[],
  javascript_identifier extends string = string,
> = {
  [name in javascript_identifier]: ValueOf<{
    [kind in AspectKind]: {
      kind: kind;
      pointcut: AspectTyping<atom, never, never, point>[kind]["pointcut"];
    };
  }>;
};

export type Advice<
  state = unknown,
  value = unknown,
  point extends Json[] = Json[],
  javascript_identifier extends string = string,
> = {
  [name in javascript_identifier]: ValueOf<{
    [kind in AspectKind]: {
      kind: kind;
      advice: AspectTyping<never, state, value, point>[kind]["advice"];
    };
  }>;
};

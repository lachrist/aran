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
  point extends Json[],
  atom extends Atom,
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
  point extends Json[],
  state,
  value,
  atom extends Atom,
> = {
  // block //
  "block@setup": {
    pointcut: GenericPointcut<point, atom, Block<atom>>;
    advice: (parent: state, ...point: point) => state;
  };
  "block@before": {
    pointcut: GenericPointcut<point, atom, Block<atom>>;
    advice: (state: state, ...point: point) => void;
  };
  "block@declaration": {
    pointcut: GenericPointcut<point, atom, Block<atom>>;
    advice: (
      state: state,
      frame: { [variable in atom["Variable"] | Parameter]: value },
      ...point: point
    ) => void;
  };
  "block@declaration-overwrite": {
    pointcut: GenericPointcut<point, atom, Block<atom>>;
    advice: (
      state: state,
      frame: { [K in atom["Variable"] | Parameter]: value },
      ...point: point
    ) => { [K in atom["Variable"] | Parameter]: value };
  };
  "program-block@after": {
    pointcut: GenericPointcut<point, atom, RoutineBlock<atom>>;
    advice: (state: state, value: value, ...point: point) => value;
  };
  "closure-block@after": {
    pointcut: GenericPointcut<point, atom, RoutineBlock<atom>>;
    advice: (state: state, value: value, ...point: point) => value;
  };
  "segment-block@after": {
    pointcut: GenericPointcut<point, atom, SegmentBlock<atom>>;
    advice: (state: state, ...point: point) => void;
  };
  "block@throwing": {
    pointcut: GenericPointcut<point, atom, Block<atom>>;
    advice: (state: state, error: value, ...point: point) => value;
  };
  "block@teardown": {
    pointcut: GenericPointcut<point, atom, Block<atom>>;
    advice: (state: state, ...point: point) => void;
  };
  // statement //
  "statement@before": {
    pointcut: GenericPointcut<point, atom, Statement<atom>>;
    advice: (state: state, ...point: point) => void;
  };
  "statement@after": {
    pointcut: GenericPointcut<point, atom, Statement<atom>>;
    advice: (state: state, ...point: point) => void;
  };
  // effect //
  "effect@before": {
    pointcut: GenericPointcut<point, atom, Effect<atom>>;
    advice: (state: state, ...point: point) => void;
  };
  "effect@after": {
    pointcut: GenericPointcut<point, atom, Effect<atom>>;
    advice: (state: state, ...point: point) => void;
  };
  // expression //
  "expression@before": {
    pointcut: GenericPointcut<point, atom, Expression<atom>>;
    advice: (state: state, ...point: point) => void;
  };
  "expression@after": {
    pointcut: GenericPointcut<point, atom, Expression<atom>>;
    advice: (state: state, result: value, ...point: point) => value;
  };
  // eval //
  "eval@before": {
    pointcut: GenericPointcut<
      point,
      atom,
      Expression<atom> & { type: "EvalExpression" }
    >;
    advice: (state: state, code: value, ...point: point) => value;
  };
  // apply - construct //
  "apply@around": {
    pointcut: GenericPointcut<
      point,
      atom,
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
      point,
      atom,
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
  point extends Json[] = Json[],
  state extends unknown = unknown,
  value extends unknown = unknown,
  atom extends Atom = Atom,
> = ValueOf<{
  [kind in AspectKind]: {
    kind: kind;
    pointcut: AspectTyping<point, never, never, atom>[kind]["pointcut"];
    advice: AspectTyping<point, state, value, never>[kind]["advice"];
  };
}>;

export type PointcutElement<
  point extends Json[] = Json[],
  atom extends Atom = Atom,
> = ValueOf<{
  [kind in AspectKind]: {
    kind: kind;
    pointcut: AspectTyping<point, never, never, atom>[kind]["pointcut"];
  };
}>;

export type AdviceElement<
  point extends Json[] = Json[],
  state extends unknown = unknown,
  value extends unknown = unknown,
> = ValueOf<{
  [kind in AspectKind]: {
    kind: kind;
    advice: AspectTyping<point, state, value, never>[kind]["advice"];
  };
}>;

export type Aspect<
  point extends Json[] = Json[],
  state = unknown,
  value = unknown,
  atom extends Atom = Atom,
  javascript_identifier extends string = string,
> = {
  [name in javascript_identifier]: AspectElement<point, state, value, atom>;
};

export type Pointcut<
  point extends Json[] = Json[],
  atom extends Atom = Atom,
  javascript_identifier extends string = string,
> = {
  [name in javascript_identifier]: PointcutElement<point, atom>;
};

export type Advice<
  point extends Json[] = Json[],
  state = unknown,
  value = unknown,
  javascript_identifier extends string = string,
> = {
  [name in javascript_identifier]: AdviceElement<point, state, value>;
};

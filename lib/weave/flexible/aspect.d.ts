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
import type { GetDefault, Json } from "../../util/util";
import type { ValueOf } from "../../util/util";

export type BlockPointcut<atom extends Atom, point extends Json[]> = (
  node: SegmentBlock<atom> | RoutineBlock<atom>,
  parent: Node<atom>,
  root: Program<atom>,
) => undefined | null | point;

export type StatementPointcut<atom extends Atom, point extends Json[]> = (
  node: Statement<atom>,
  parent: Node<atom>,
  root: Program<atom>,
) => undefined | null | point;

export type EffectPointcut<atom extends Atom, point extends Json[]> = (
  node: Effect<atom>,
  parent: Node<atom>,
  root: Program<atom>,
) => undefined | null | point;

export type ExpressionPointcut<atom extends Atom, point extends Json[]> = (
  node: Expression<atom>,
  parent: Node<atom>,
  root: Program<atom>,
) => undefined | null | point;

type Frame<variable extends string, value> = {
  [identifier in variable | Parameter]: value;
};

/**
 * The flexible weaving API expects each advice function to be a global value.
 * It is more complex to use than the standard weaving API but it let the user
 * define the static information provided to the advice functions. Unlike the
 * standard weaving API, each join point can be cut multiple times. NB: the join
 * points `apply@around` and `construct@around` can only be cut once. The join
 * points of the flexible weaving API are very similar to the join points of the
 * standard API.
 */
export type AspectTyping<
  atom extends Atom,
  point extends Json[],
  runtime extends {
    State: unknown;
    Value: unknown;
  },
> = {
  // block //
  "block@setup": {
    pointcut: BlockPointcut<atom, point>;
    advice: (state: runtime["State"], ...point: point) => runtime["State"];
  };
  "block@before": {
    pointcut: BlockPointcut<atom, point>;
    advice: (state: runtime["State"], ...point: point) => void;
  };
  "block@declaration": {
    pointcut: BlockPointcut<atom, point>;
    advice: (
      state: runtime["State"],
      frame: Frame<atom["Variable"], runtime["Value"]>,
      ...point: point
    ) => void;
  };
  "block@declaration-overwrite": {
    pointcut: BlockPointcut<atom, point>;
    advice: (
      state: runtime["State"],
      frame: Frame<atom["Variable"], runtime["Value"]>,
      ...point: point
    ) => Frame<atom["Variable"], runtime["Value"]>;
  };
  "block@after": {
    pointcut: BlockPointcut<atom, point>;
    advice: (state: runtime["State"], ...point: point) => void;
  };
  "block@throwing": {
    pointcut: BlockPointcut<atom, point>;
    advice: (
      state: runtime["State"],
      error: runtime["Value"],
      ...point: point
    ) => runtime["Value"];
  };
  "block@teardown": {
    pointcut: BlockPointcut<atom, point>;
    advice: (state: runtime["State"], ...point: point) => void;
  };
  // statement //
  "statement@before": {
    pointcut: StatementPointcut<atom, point>;
    advice: (state: runtime["State"], ...point: point) => void;
  };
  "statement@after": {
    pointcut: StatementPointcut<atom, point>;
    advice: (state: runtime["State"], ...point: point) => void;
  };
  // effect //
  "effect@before": {
    pointcut: EffectPointcut<atom, point>;
    advice: (state: runtime["State"], ...point: point) => void;
  };
  "effect@after": {
    pointcut: EffectPointcut<atom, point>;
    advice: (state: runtime["State"], ...point: point) => void;
  };
  // expression //
  "expression@before": {
    pointcut: ExpressionPointcut<atom, point>;
    advice: (state: runtime["State"], ...point: point) => void;
  };
  "expression@after": {
    pointcut: ExpressionPointcut<atom, point>;
    advice: (
      state: runtime["State"],
      result: runtime["Value"],
      ...point: point
    ) => runtime["Value"];
  };
  // apply - construct //
  "apply@around": {
    pointcut: ExpressionPointcut<atom, point>;
    advice: (
      state: runtime["State"],
      callee: runtime["Value"],
      this_: runtime["Value"],
      arguments_: runtime["Value"][],
      ...point: point
    ) => runtime["Value"];
  };
  "construct@around": {
    pointcut: ExpressionPointcut<atom, point>;
    advice: (
      state: runtime["State"],
      callee: runtime["Value"],
      arguments_: runtime["Value"][],
      ...point: point
    ) => runtime["Value"];
  };
};

export type AspectKind = keyof AspectTyping<never, never, never>;

export type PointcutElement<
  kind extends AspectKind,
  atom extends Atom,
  point extends Json[],
> = AspectTyping<atom, point, { State: never; Value: never }>[kind]["pointcut"];

export type AdviceElement<
  kind extends AspectKind,
  atom extends { Variable: string },
  point extends Json[],
  runtime extends { State: unknown; Value: unknown } = {
    State: unknown;
    Value: unknown;
  },
> = AspectTyping<
  atom & { Label: never; Specifier: never; Source: never; Tag: never },
  point,
  runtime
>[kind]["advice"];

export type Aspect<
  param extends {
    AdviceGlobalVariable?: string;
    State?: unknown;
    Value?: unknown;
    Atom?: Atom;
    Point?: Json[];
  } = {},
> = {
  [key in param["AdviceGlobalVariable"] & string]: ValueOf<{
    [key in AspectKind]: {
      kind: key;
      pointcut: PointcutElement<
        key,
        GetDefault<param, "Atom", Atom>,
        GetDefault<param, "Point", Json[]>
      >;
      advice: AdviceElement<
        key,
        GetDefault<param, "Atom", Atom>,
        GetDefault<param, "Point", Json[]>,
        {
          State: param["State"];
          Value: param["Value"];
        }
      >;
    };
  }>;
};

export type Pointcut<
  param extends {
    AdviceGlobalVariable?: string;
    Atom?: Atom;
    Point?: Json[];
  } = {},
> = {
  [key in param["AdviceGlobalVariable"] & string]: ValueOf<{
    [key in AspectKind]: {
      kind: key;
      pointcut: PointcutElement<
        key,
        GetDefault<param, "Atom", Atom>,
        GetDefault<param, "Point", Json[][]>
      >;
    };
  }>;
};

export type Advice<
  param extends {
    AdviceGlobalVariable?: string;
    State?: unknown;
    Value?: unknown;
    Atom?: { Variable: string };
    Point?: Json[];
  } = {},
> = {
  [key in param["AdviceGlobalVariable"] & string]: ValueOf<{
    [key in AspectKind]: {
      kind: key;
      advice: AdviceElement<
        key,
        GetDefault<param, "Atom", { Variable: string }>,
        GetDefault<param, "Point", Json[]>,
        {
          State: param["State"];
          Value: param["Value"];
        }
      >;
    };
  }>;
};

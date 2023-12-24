import { Prelude } from "./prelude";

export type Sequence<W, X> = { head: W[]; tail: X };

export type EffectSequence<X> = Sequence<aran.Effect<unbuild.Atom>, X>;

// export type StatementSequence<X> = Sequence<aran.Statement<unbuild.Atom>, X>;

export type PreludeSequence<X> = Sequence<Prelude, X>;

export type Condition =
  | {
      type: "effect";
      node: aran.Effect<unbuild.Atom>;
    }
  | {
      type: "condition";
      test: aran.Expression<unbuild.Atom>;
      exit: aran.Expression<unbuild.Atom>;
    };

export type ConditionSequence<X> = Sequence<Condition, X>;

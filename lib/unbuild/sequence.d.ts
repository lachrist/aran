export type Sequence<W, X> = { head: W[]; tail: X };

export type EffectSequence<X> = Sequence<aran.Effect<unbuild.Atom>, X>;

export type StatementSequence<X> = Sequence<aran.Statement<unbuild.Atom>, X>;

export type BlockSequence<X> = Sequence<
  unbuild.Variable | aran.Statement<unbuild.Atom>,
  X
>;

import {
  BlockPrelude,
  ChainPrelude,
  NodePrelude,
  ProgramPrelude,
  SetupPrelude,
} from "./prelude";

export type Sequence<W, X> = { head: W[]; tail: X };

export type ProgramSequence = Sequence<
  ProgramPrelude,
  aran.Program<unbuild.Atom>
>;

export type ControlBlockSequence = Sequence<
  BlockPrelude,
  aran.ControlBlock<unbuild.Atom>
>;

export type ClosureBlockSequence = Sequence<
  BlockPrelude,
  aran.ClosureBlock<unbuild.Atom>
>;

export type StatementSequence = Sequence<
  NodePrelude,
  aran.Statement<unbuild.Atom>[]
>;

export type EffectSequence = Sequence<NodePrelude, aran.Effect<unbuild.Atom>[]>;

export type ExpressionSequence = Sequence<
  NodePrelude,
  aran.Expression<unbuild.Atom>
>;

export type SetupSequence<X> = Sequence<SetupPrelude, X>;

export type ChainSequence<X> = Sequence<ChainPrelude, X>;

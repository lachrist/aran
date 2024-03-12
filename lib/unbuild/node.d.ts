import { BlockPrelude, NodePrelude, ProgramPrelude } from "./prelude";
import { Sequence } from "./sequence";

export type ExpressionSequence = Sequence<
  NodePrelude,
  aran.Expression<unbuild.Atom>
>;

export type EffectSequence = Sequence<NodePrelude, aran.Effect<unbuild.Atom>[]>;

export type StatementSequence = Sequence<
  NodePrelude,
  aran.Statement<unbuild.Atom>[]
>;

export type ClosureBlockSequence = Sequence<
  BlockPrelude,
  aran.ClosureBlock<unbuild.Atom>
>;

export type ControlBlockSequence = Sequence<
  BlockPrelude,
  aran.ControlBlock<unbuild.Atom>
>;

export type ProgramSequence = Sequence<
  ProgramPrelude,
  aran.Program<unbuild.Atom>
>;

import { ClosureBody, ControlBody } from "./body";
import {
  BlockPrelude,
  BodyPrelude,
  ChainPrelude,
  NodePrelude,
  ProgramPrelude,
} from "./prelude";

export type Sequence<W, X> = { head: W[]; tail: X };

// Program //

export type ProgramSequence = Sequence<
  ProgramPrelude,
  aran.Program<unbuild.Atom>
>;

// Block //

export type ControlBlockSequence = Sequence<
  BlockPrelude,
  aran.ControlBlock<unbuild.Atom>
>;

export type ClosureBlockSequence = Sequence<
  BlockPrelude,
  aran.ClosureBlock<unbuild.Atom>
>;

// Body //

export type ControlBodySequence = Sequence<
  BodyPrelude,
  ControlBody<unbuild.Atom>
>;

export type ClosureBodySequence = Sequence<
  BodyPrelude,
  ClosureBody<unbuild.Atom>
>;

// Statement //

export type StatementSequence = Sequence<
  NodePrelude,
  aran.Statement<unbuild.Atom>[]
>;

// Effect //

export type EffectSequence = Sequence<NodePrelude, aran.Effect<unbuild.Atom>[]>;

// Expression //

export type ExpressionSequence = Sequence<
  NodePrelude,
  aran.Expression<unbuild.Atom>
>;

// Chain //

export type ChainSequence<X> = Sequence<ChainPrelude, X>;

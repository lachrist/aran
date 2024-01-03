import { Log } from "./log";
import { Header } from "../header";
import { EarlyError } from "./early-error";
import { Condition } from "./condition";
import { Context } from "./context";
import { EffectSequence } from "./sequence";

export type LogPrelude = {
  type: "log";
  data: Log;
};

export type ContextPrelude = {
  type: "context";
  data: Context;
};

type ProgramPrelude = LogPrelude | ContextPrelude;

export type HeaderPrelude = {
  type: "header";
  data: Header;
};

export type EarlyErrorPrelude = {
  type: "early-error";
  data: EarlyError;
};

type BlockPrelude = ProgramPrelude | HeaderPrelude | EarlyErrorPrelude;

export type DeclarationPrelude = {
  type: "declaration";
  data: unbuild.Variable;
};

type NodePrelude = BlockPrelude | DeclarationPrelude;

export type EffectPrelude = {
  type: "effect";
  data: aran.Effect<unbuild.Atom>;
};

type SetupPrelude = NodePrelude | EffectPrelude;

export type ConditionPrelude = {
  type: "condition";
  data: Condition;
};

type ChainPrelude = SetupPrelude | ConditionPrelude;

export type Prelude =
  | LogPrelude
  | ContextPrelude
  | HeaderPrelude
  | EarlyErrorPrelude
  | DeclarationPrelude
  | EffectPrelude
  | ConditionPrelude;

import { Log } from "./log";
import { Header } from "../header";
import { EarlyError } from "./early-error";
import { Condition } from "./condition";
import { Context } from "./context";
import { Variable, BaseVariable, MetaVariable } from "./variable";

export type LogPrelude = {
  type: "log";
  data: Log;
};

export type ContextPrelude = {
  type: "context";
  data: Context;
};

export type HeaderPrelude = {
  type: "header";
  data: Header;
};

export type EarlyErrorPrelude = {
  type: "early-error";
  data: EarlyError;
};

export type DeclarationPrelude = {
  type: "declaration";
  data: Variable;
};

export type BaseDeclarationPrelude = DeclarationPrelude & {
  data: BaseVariable;
};

export type MetaDeclarationPrelude = DeclarationPrelude & {
  data: MetaVariable;
};

export type EffectPrelude = {
  type: "effect";
  data: aran.Effect<unbuild.Atom>;
};

export type ConditionPrelude = {
  type: "condition";
  data: Condition;
};

export type Prelude =
  | LogPrelude
  | ContextPrelude
  | HeaderPrelude
  | EarlyErrorPrelude
  | DeclarationPrelude
  | EffectPrelude
  | ConditionPrelude;

type ProgramPrelude = LogPrelude | ContextPrelude;

type BlockPrelude =
  | LogPrelude
  | ContextPrelude
  | HeaderPrelude
  | EarlyErrorPrelude;

type BodyPrelude =
  | LogPrelude
  | ContextPrelude
  | HeaderPrelude
  | EarlyErrorPrelude
  | DeclarationPrelude
  | EffectPrelude;

type NodePrelude =
  | LogPrelude
  | ContextPrelude
  | HeaderPrelude
  | EarlyErrorPrelude
  | MetaDeclarationPrelude
  | EffectPrelude;

type ChainPrelude =
  | LogPrelude
  | ContextPrelude
  | HeaderPrelude
  | EarlyErrorPrelude
  | MetaDeclarationPrelude
  | EffectPrelude
  | ConditionPrelude;

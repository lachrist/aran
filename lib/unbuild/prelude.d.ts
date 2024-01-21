import { Warning } from "./warning";
import { Header } from "../header";
import { EarlyError } from "./early-error";
import { Condition } from "./condition";
import { Context } from "../context";
import { Variable, BaseVariable, MetaVariable } from "./variable";
import { Site } from "./site";

export type WarningPrelude = {
  type: "warning";
  data: Warning;
};

export type ContextPrelude = {
  type: "context";
  data: [unbuild.Path, Context];
};

export type HeaderPrelude = {
  type: "header";
  data: Header;
};

export type EarlyErrorPrelude = {
  type: "early-error";
  data: EarlyError;
};

export type TemplatePrelude = {
  type: "template";
  data: {
    variable: MetaVariable;
    value: Site<estree.TaggedTemplateExpression>;
  };
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
  | WarningPrelude
  | ContextPrelude
  | HeaderPrelude
  | EarlyErrorPrelude
  | DeclarationPrelude
  | EffectPrelude
  | ConditionPrelude
  | TemplatePrelude;

type ProgramPrelude = WarningPrelude | ContextPrelude;

type BlockPrelude =
  | WarningPrelude
  | ContextPrelude
  | TemplatePrelude
  | HeaderPrelude
  | EarlyErrorPrelude;

type BodyPrelude =
  | WarningPrelude
  | ContextPrelude
  | TemplatePrelude
  | HeaderPrelude
  | EarlyErrorPrelude
  | DeclarationPrelude
  | EffectPrelude;

type NodePrelude =
  | WarningPrelude
  | ContextPrelude
  | TemplatePrelude
  | HeaderPrelude
  | EarlyErrorPrelude
  | MetaDeclarationPrelude
  | EffectPrelude;

type ChainPrelude =
  | WarningPrelude
  | ContextPrelude
  | TemplatePrelude
  | HeaderPrelude
  | EarlyErrorPrelude
  | MetaDeclarationPrelude
  | EffectPrelude
  | ConditionPrelude;

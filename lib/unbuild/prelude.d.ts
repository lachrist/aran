import type { Warning } from "./warning";
import type { Header } from "../header";
import type { EarlyError } from "./early-error";
import type { Condition } from "./condition";
import type { DeepLocalContext } from "../program";
import type { BaseVariable, MetaVariable } from "./variable";
import type { Template } from "./template";
import type { Intrinsic } from "../lang";
import type { Path } from "../path";
import type { Effect } from "./atom";

export type WarningPrelude = {
  type: "warning";
  data: Warning;
};

export type ContextPrelude = {
  type: "context";
  data: [Path, DeepLocalContext];
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
  data: Template;
};

export type MetaDeclarationPrelude = {
  type: "meta-declaration";
  data: [MetaVariable, Intrinsic];
};

export type BaseDeclarationPrelude = {
  type: "base-declaration";
  data: [BaseVariable, Intrinsic];
};

export type DeclarationPrelude =
  | MetaDeclarationPrelude
  | BaseDeclarationPrelude;

export type PrefixPrelude = {
  type: "prefix";
  data: Effect;
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
  | TemplatePrelude
  | BaseDeclarationPrelude
  | MetaDeclarationPrelude
  | PrefixPrelude
  | ConditionPrelude;

type ProgramPrelude = WarningPrelude | ContextPrelude;

type BlockPrelude =
  | WarningPrelude
  | ContextPrelude
  | HeaderPrelude
  | EarlyErrorPrelude
  | TemplatePrelude;

export type BodyPrelude =
  | WarningPrelude
  | ContextPrelude
  | HeaderPrelude
  | EarlyErrorPrelude
  | TemplatePrelude
  | BaseDeclarationPrelude
  | MetaDeclarationPrelude;

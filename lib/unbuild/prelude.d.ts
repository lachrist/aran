import { Warning } from "./warning";
import { Header } from "../header";
import { EarlyError } from "./early-error";
import { Condition } from "./condition";
import { DeepLocalContext } from "../program";
import { BaseVariable, MetaVariable } from "./variable";
import { Template } from "./template";
import { Intrinsic } from "../../type/aran";
import { Path } from "../path";
import { Atom } from "./atom";

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
  data: aran.Effect<Atom>;
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

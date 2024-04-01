import { Warning } from "./warning";
import { Header } from "../header";
import { EarlyError } from "./early-error";
import { Condition } from "./condition";
import { Context } from "../context";
import { BaseVariable, MetaVariable } from "./variable";
import { Site } from "./site";
import { Isolate } from "../../type/aran";
import { Sequence } from "./sequence";
import { Template } from "./template";

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
  data: Template;
};

export type MetaDeclarationPrelude = {
  type: "meta-declaration";
  data: [MetaVariable, Isolate];
};

export type BaseDeclarationPrelude = {
  type: "base-declaration";
  data: [BaseVariable, Isolate];
};

export type DeclarationPrelude =
  | MetaDeclarationPrelude
  | BaseDeclarationPrelude;

export type PrefixPrelude = {
  type: "prefix";
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

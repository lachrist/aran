import { Warning } from "./warning";
import { Header } from "../header";
import { EarlyError } from "./early-error";
import { Condition } from "./condition";
import { Context } from "../context";
import { BaseVariable, MetaVariable } from "./variable";
import { Site } from "./site";
import { Isolate } from "../../type/aran";
import { Sequence } from "./sequence";

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

export type DuplicatePrelude = {
  type: "duplicate";
  data: {
    frame: "aran.global" | "aran.record";
    variable: estree.Variable;
    path: unbuild.Path;
  };
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
  | DuplicatePrelude
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
  | TemplatePrelude
  | DuplicatePrelude;

export type BodyPrelude =
  | WarningPrelude
  | ContextPrelude
  | HeaderPrelude
  | EarlyErrorPrelude
  | TemplatePrelude
  | DuplicatePrelude
  | BaseDeclarationPrelude
  | MetaDeclarationPrelude;

import type { Header } from "../../lang/header.d.ts";
import type { SyntaxError } from "./syntax-error.d.ts";
import type { Condition } from "./condition.d.ts";
import type { BaseVariable, MetaVariable } from "../variable.d.ts";
import type { Template } from "./template.d.ts";
import type { Intrinsic } from "../../lang/syntax.d.ts";
import type { Effect } from "../atom.d.ts";
import type { PrivateKeyName, VariableName } from "estree-sentry";
import type { ReifyExternal } from "./external.d.ts";
import type { RawWarning } from "./warning.d.ts";

export type ReturnIteratorPrelude = {
  type: "iterator-return";
  iterator: MetaVariable;
  done: MetaVariable;
};

export type NativeExternalPrelude = {
  type: "external-native";
  data: VariableName;
};

export type ReifyExternalPrelude = {
  type: "external-reify";
  data: ReifyExternal;
};

export type UnboundPrivatePrelude = {
  type: "private-unbound";
  data: PrivateKeyName;
};

export type TemplatePrelude = {
  type: "template";
  data: Template;
};

export type WarningPrelude = {
  type: "warning";
  data: RawWarning;
};

export type HeaderPrelude = {
  type: "header";
  data: Header;
};

export type SyntaxErrorPrelude = {
  type: "syntax-error";
  data: SyntaxError;
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
  | HeaderPrelude
  | SyntaxErrorPrelude
  | ReifyExternalPrelude
  | NativeExternalPrelude
  | UnboundPrivatePrelude
  | TemplatePrelude
  | BaseDeclarationPrelude
  | MetaDeclarationPrelude
  | PrefixPrelude
  | ConditionPrelude;

type ProgramPrelude = SyntaxErrorPrelude | WarningPrelude;

type NotBlockPrelude = Exclude<Prelude, BlockPrelude>;

type BlockPrelude =
  | WarningPrelude
  | HeaderPrelude
  | UnboundPrivatePrelude
  | ReifyExternalPrelude
  | NativeExternalPrelude
  | SyntaxErrorPrelude
  | TemplatePrelude;

export type BodyPrelude =
  | WarningPrelude
  | HeaderPrelude
  | ReifyExternalPrelude
  | NativeExternalPrelude
  | UnboundPrivatePrelude
  | HeaderPrelude
  | SyntaxErrorPrelude
  | TemplatePrelude
  | BaseDeclarationPrelude
  | MetaDeclarationPrelude;

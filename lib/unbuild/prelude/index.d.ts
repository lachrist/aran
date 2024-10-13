import type { Header } from "../../header";
import type { SyntaxError } from "./syntax-error";
import type { Condition } from "./condition";
import type { BaseVariable, MetaVariable } from "../variable";
import type { Template } from "./template";
import type { Intrinsic } from "../../lang";
import type { Hash } from "../../hash";
import type { Effect } from "../atom";
import type { Reboot } from "../../reboot";
import type { PrivateKeyName, VariableName } from "estree-sentry";
import type { ReifyExternal } from "./external";
import type { Warning } from "./warning";

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
  data: Warning;
};

export type RebootPrelude = {
  type: "reboot";
  data: [Hash, Reboot];
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
  | RebootPrelude
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

type ProgramPrelude = SyntaxErrorPrelude | WarningPrelude | RebootPrelude;

type NotBlockPrelude = Exclude<Prelude, BlockPrelude>;

type BlockPrelude =
  | WarningPrelude
  | RebootPrelude
  | HeaderPrelude
  | UnboundPrivatePrelude
  | ReifyExternalPrelude
  | NativeExternalPrelude
  | SyntaxErrorPrelude
  | TemplatePrelude;

export type BodyPrelude =
  | WarningPrelude
  | RebootPrelude
  | HeaderPrelude
  | ReifyExternalPrelude
  | NativeExternalPrelude
  | UnboundPrivatePrelude
  | HeaderPrelude
  | SyntaxErrorPrelude
  | TemplatePrelude
  | BaseDeclarationPrelude
  | MetaDeclarationPrelude;

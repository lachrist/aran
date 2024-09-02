import type { Header } from "../../header";
import type { Error } from "./error";
import type { Condition } from "./condition";
import type { BaseVariable, MetaVariable } from "../variable";
import type { Template } from "./template";
import type { Intrinsic } from "../../lang";
import type { Path } from "../../path";
import type { Effect } from "../atom";
import type { Reboot } from "../../reboot";
import type { PrivateKey } from "../../estree";
import type { ReifyExternal } from "./external";
import type { Variable } from "../../estree";
import type { Warning } from "./warning";

export type ReturnIteratorPrelude = {
  type: "iterator-return";
  iterator: MetaVariable;
  done: MetaVariable;
};

export type NativeExternalPrelude = {
  type: "external-native";
  data: Variable;
};

export type ReifyExternalPrelude = {
  type: "external-reify";
  data: ReifyExternal;
};

export type UnboundPrivatePrelude = {
  type: "private-unbound";
  data: PrivateKey;
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
  data: [Path, Reboot];
};

export type HeaderPrelude = {
  type: "header";
  data: Header;
};

export type ErrorPrelude = {
  type: "error";
  data: Error;
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
  | ErrorPrelude
  | ReifyExternalPrelude
  | NativeExternalPrelude
  | UnboundPrivatePrelude
  | TemplatePrelude
  | BaseDeclarationPrelude
  | MetaDeclarationPrelude
  | PrefixPrelude
  | ConditionPrelude;

type ProgramPrelude = WarningPrelude | RebootPrelude;

type BlockPrelude =
  | WarningPrelude
  | RebootPrelude
  | HeaderPrelude
  | UnboundPrivatePrelude
  | ReifyExternalPrelude
  | NativeExternalPrelude
  | ErrorPrelude
  | TemplatePrelude;

export type BodyPrelude =
  | WarningPrelude
  | RebootPrelude
  | HeaderPrelude
  | ReifyExternalPrelude
  | NativeExternalPrelude
  | UnboundPrivatePrelude
  | HeaderPrelude
  | ErrorPrelude
  | TemplatePrelude
  | BaseDeclarationPrelude
  | MetaDeclarationPrelude;

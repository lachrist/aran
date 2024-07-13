import type { Warning } from "../../warning";
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
import type { Duplicate } from "./duplicate";

export type WarningPrelude = {
  type: "warning";
  data: Warning;
};

export type RebootPrelude = {
  type: "reboot";
  data: [Path, Reboot];
};

export type DuplicatePrelude = {
  type: "duplicate";
  data: Duplicate;
};

export type HeaderPrelude = {
  type: "header";
  data: Header;
};

export type PrivatePrelude = {
  type: "private";
  data: PrivateKey;
};

export type ErrorPrelude = {
  type: "error";
  data: Error;
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
  | RebootPrelude
  | HeaderPrelude
  | ErrorPrelude
  | DuplicatePrelude
  | PrivatePrelude
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
  | PrivatePrelude
  | ErrorPrelude
  | DuplicatePrelude
  | TemplatePrelude;

export type BodyPrelude =
  | WarningPrelude
  | RebootPrelude
  | HeaderPrelude
  | PrivatePrelude
  | DuplicatePrelude
  | HeaderPrelude
  | ErrorPrelude
  | TemplatePrelude
  | BaseDeclarationPrelude
  | MetaDeclarationPrelude;

import type { Brand } from "../brand";

export type BaseVariable = Brand<string, "unbuild.BaseVariable">;

export type ConstantMetaVariable = Brand<
  string,
  "unbuild.ConstantMetaVariable"
>;

export type WritableMetaVariable = Brand<
  string,
  "unbuild.WritableMetaVariable"
>;

export type MetaVariable = ConstantMetaVariable | WritableMetaVariable;

export type Variable = BaseVariable | MetaVariable;

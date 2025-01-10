import type { Brand } from "../util/util";

export type BaseVariable = Brand<string, "trans.BaseVariable">;

export type ConstantMetaVariable = Brand<string, "trans.ConstantMetaVariable">;

export type WritableMetaVariable = Brand<string, "trans.WritableMetaVariable">;

export type MetaVariable = ConstantMetaVariable | WritableMetaVariable;

export type Variable = BaseVariable | MetaVariable;

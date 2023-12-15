import { Header } from "../lib/header.js";
import type { Context, EvalContext } from "../lib/unbuild/context.d.ts";
import { Tell } from "../lib/unbuild/tell.js";

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

export type Label = Brand<string, "unbuild.Label">;

export type Path = Brand<string, "unbuild.Path">;

export type Meta = Brand<bigint, "unbuild.Meta">;

export type Error = {
  name: "SyntaxError";
  message: string;
  path: unbuild.Path;
};

export type Warning = {
  name:
    | "ExternalConst"
    | "ExternalLet"
    | "SloppyBlockFunctionDeclaration"
    | "StrictKeywordExternalVariable"
    | "StrictReadonlyExternalVariableWrite"
    | "ExternalVariableClash"
    | "GeneratorParameterPattern"
    | "DirectEvalExternalVariableDeclaration"
    | "KeywordLocalExternalRead"
    | "KeywordLocalExternalTypeof"
    | "SloppyLocalExternalDiscard"
    | "SloppyLocalExternalWrite"
    | "KeywordLocalExternalWrite";
  message: string;
  path: unbuild.Path;
};

export type Log = Error | Warning;

export type Atom = {
  Label: Label;
  Source: estree.Source;
  Specifier: estree.Specifier;
  Variable: Variable;
  GlobalVariable: estree.Variable;
  Tag: {
    path: Path;
    tells: Tell[];
  };
};

export as namespace unbuild;

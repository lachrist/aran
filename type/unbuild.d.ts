import type { Context } from "../lib/unbuild/context.d.ts";

export type DeadzoneBaseVariable = Brand<
  string,
  "unbuild.DeadzoneBaseVariable"
>;

export type OriginalBaseVariable = Brand<
  string,
  "unbuild.OriginalBaseVariable"
>;

export type ConstantMetaVariable = Brand<
  string,
  "unbuild.ConstantMetaVariable"
>;

export type WritableMetaVariable = Brand<
  string,
  "unbuild.WritableMetaVariable"
>;

export type MetaVariable = ConstantMetaVariable | WritableMetaVariable;

export type BaseVariable = DeadzoneBaseVariable | OriginalBaseVariable;

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
    | "SloppyBlockFunctionDeclaration"
    | "SloppyExternalVariableWrite"
    | "ExternalVariableDelete"
    | "StrictKeywordExternalVariable"
    | "StrictReadonlyExternalVariableWrite"
    | "ExternalVariableClash"
    | "GeneratorParameterPattern"
    | "DirectEvalExternalVariableDeclaration";
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
    initialization: boolean | null;
    context: (Context & { meta: string }) | null;
    logs: Omit<Log, "path">[];
  };
};

export as namespace unbuild;

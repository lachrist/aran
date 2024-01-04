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

export type Atom = {
  Label: Label;
  Source: estree.Source;
  Specifier: estree.Specifier;
  Variable: Variable;
  GlobalVariable: estree.Variable;
  Tag: Path;
};

export as namespace unbuild;

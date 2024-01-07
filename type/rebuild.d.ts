export type Label = Brand<string, "rebuild.Label">;

export type Variable = Brand<string, "rebuild.Variable">;

export type Atom = {
  Label: Label;
  Source: estree.Source;
  Specifier: estree.Specifier;
  Variable: Variable;
  Tag: null;
};

export as namespace rebuild;

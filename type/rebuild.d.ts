export type Label = Brand<string, "rebuild.Label">;

export type Variable = Brand<string, "rebuild.Variable">;

export type Log = {
  severity: "error";
  name: "ClashError";
  message: string;
};

export type Atom = {
  Label: Label;
  Source: estree.Source;
  Specifier: estree.Specifier;
  Variable: Variable;
  GlobalVariable: estree.Variable;
  Tag: unknown;
};

export as namespace rebuild;

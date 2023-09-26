export {};

export type Variable = Brand<string, "unbuild.Variable">;

export type Label = Brand<string, "unbuild.Label">;

export type Hash = Brand<string, "unbuild.Hash">;

export type Atom<S> = {
  Label: Label;
  Source: estree.Source;
  Specifier: estree.Specifier;
  Variable: Variable;
  EnclaveVariable: estree.Variable;
  Tag: {
    serial: S;
    initialization: Variable | null;
  };
};

export as namespace unbuild;

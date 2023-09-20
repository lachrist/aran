declare namespace unbuild {
  type Variable = Brand<string, "unbuild.Variable">;
  type Label = Brand<string, "unbuild.Label">;
  type Hash = Brand<string, "unbuild.Hash">;
  type Atom<S> = {
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
}

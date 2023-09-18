declare namespace rebuild {
  type Variable = Brand<string, "rebuild.Variable">;
  type Label = Brand<string, "rebuild.Label">;
  type Atom = {
    Label: Label;
    Source: estree.Source;
    Specifier: estree.Specifier;
    Variable: Variable;
    EnclaveVariable: estree.Variable;
    Tag: unknown;
  };
}

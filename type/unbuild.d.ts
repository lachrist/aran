declare namespace unbuild {
  type Variable = Brand<string, "unbuild.Variable">;
  type Label = Brand<string, "unbuild.Label">;
  type Atom<T> = {
    Label: Label;
    Source: estree.Source;
    Specifier: estree.Specifier;
    Variable: Variable;
    EnclaveVariable: estree.Variable;
    Tag: T;
  };
}

declare namespace weave {
  type ArgVariable = Brand<string, "weave.ArgVariable">;
  type ResVariable = Brand<string, "weave.ResVariable">;
  type Label = Brand<string, "weave.ArgLabel">;
  type ArgAtom<T> = {
    Label: Label;
    Source: estree.Source;
    Specifier: estree.Specifier;
    Variable: ArgVariable;
    EnclaveVariable: estree.Variable;
    Tag: T;
  };
  type ResAtom = {
    Label: Label;
    Source: estree.Source;
    Specifier: estree.Specifier;
    Variable: ResVariable;
    EnclaveVariable: estree.Variable;
    Tag: ResVariable[];
  };
}

declare namespace convert {
  type Location = { line: number; column: number };
  type Variable = Brand<string, "convert.Variable">;
  type EnclaveVariable = Brand<string, "convert.EnclaveVariable">;
  type Label = Brand<string, "convert.Label">;
  type Source = Brand<string, "convert.Source">;
  type Specifier = Brand<string, "convert.Specifier">;
  type Atom = {
    Label: Label;
    Source: Source;
    Specifier: Specifier;
    Variable: Variable;
    EnclaveVariable: EnclaveVariable;
    Tag: Location;
  };
}

declare namespace revert {
  type Variable = Brand<string, "revert.Variable">;
  type EnclaveVariable = Brand<string, "revert.EnclaveVariable">;
  type Label = Brand<string, "revert.Label">;
  type Source = Brand<string, "revert.Source">;
  type Specifier = Brand<string, "revert.Specifier">;
  type Atom = {
    Label: Label;
    Source: Source;
    Specifier: Specifier;
    Variable: Variable;
    EnclaveVariable: EnclaveVariable;
    Tag: unknown;
  };
}

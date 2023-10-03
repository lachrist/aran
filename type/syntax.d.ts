export {};

declare global {
  namespace convert {
    type Location = { line: number; column: number };
    type Variable = Brand<string, "convert.Variable">;
    type GlobalVariable = Brand<string, "convert.GlobalVariable">;
    type Label = Brand<string, "convert.Label">;
    type Source = Brand<string, "convert.Source">;
    type Specifier = Brand<string, "convert.Specifier">;
    type Atom = {
      Label: Label;
      Source: Source;
      Specifier: Specifier;
      Variable: Variable;
      GlobalVariable: GlobalVariable;
      Tag: Location;
    };
  }
  namespace revert {
    type Variable = Brand<string, "revert.Variable">;
    type GlobalVariable = Brand<string, "revert.GlobalVariable">;
    type Label = Brand<string, "revert.Label">;
    type Source = Brand<string, "revert.Source">;
    type Specifier = Brand<string, "revert.Specifier">;
    type Atom = {
      Label: Label;
      Source: Source;
      Specifier: Specifier;
      Variable: Variable;
      GlobalVariable: GlobalVariable;
      Tag: unknown;
    };
  }
}

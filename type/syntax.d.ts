export {};

declare global {
  namespace convert {
    type Location = { line: number; column: number };
    type Variable = Brand<string, "convert.Variable">;
    type Label = Brand<string, "convert.Label">;
    type Source = Brand<string, "convert.Source">;
    type Specifier = Brand<string, "convert.Specifier">;
    type Atom = {
      Label: Label;
      Source: Source;
      Specifier: Specifier;
      Variable: Variable;
      Tag: Location;
    };
  }
  namespace revert {
    type Variable = Brand<string, "revert.Variable">;
    type Label = Brand<string, "revert.Label">;
    type Source = Brand<string, "revert.Source">;
    type Specifier = Brand<string, "revert.Specifier">;
    type Atom = {
      Label: Label;
      Source: Source;
      Specifier: Specifier;
      Variable: Variable;
      Tag: unknown;
    };
  }
}

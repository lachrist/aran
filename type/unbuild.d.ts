import { Variable } from "../lib/unbuild/variable";

export type Label = Brand<string, "unbuild.Label">;

export type Path = Brand<string, "unbuild.Path">;

export type Atom = {
  Label: Label;
  Source: estree.Source;
  Specifier: estree.Specifier;
  Variable: Variable;
  Tag: Path;
};

export as namespace unbuild;

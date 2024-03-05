import type { Variable } from "../lib/unbuild/variable.d.ts";
import type { Path } from "../lib/unbuild/path.d.ts";

export type Label = Brand<string, "unbuild.Label">;

export type { Path } from "../lib/unbuild/path.d.ts";

export type Atom = {
  Label: Label;
  Source: estree.Source;
  Specifier: estree.Specifier;
  Variable: Variable;
  Tag: Path;
};

export as namespace unbuild;

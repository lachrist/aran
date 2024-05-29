import type { Variable } from "../lib/unbuild/variable.d.ts";
import type { Path } from "../lib/path.js";

export type Label = Brand<string, "unbuild.Label">;

export type { Path } from "../lib/path.js";

export type Atom = {
  Label: Label;
  Source: estree.Source;
  Specifier: estree.Specifier;
  Variable: Variable;
  Tag: Path;
};

export as namespace unbuild;

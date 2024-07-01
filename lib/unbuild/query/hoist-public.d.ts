import type { Source, Specifier, Variable } from "../../estree";
import type { Path } from "../../path";

export type Write = "perform" | "report" | "ignore";

export type Baseline = "deadzone" | "undefined" | "import";

export type ImportBinding = {
  variable: Variable;
  baseline: "import";
  write: "report";
  import: {
    source: Source;
    specifier: Specifier | null;
  };
};

export type RegularBinding = {
  variable: Variable;
  baseline: "deadzone" | "undefined";
  write: Write;
  import: null;
};

export type Binding = ImportBinding | RegularBinding;

export type Duplicate = {
  variable: Variable;
  origin: Path;
};

export type Hoisting = { [key in Path]?: Binding[] };

export type Result = {
  report: Duplicate[];
  unbound: Binding[];
  hoisting: Hoisting;
};

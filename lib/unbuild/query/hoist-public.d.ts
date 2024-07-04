import type { Variable } from "../../estree";
import type { Path } from "../../path";

export type Write = "perform" | "report" | "ignore";

export type Baseline = "deadzone" | "undefined" | "import";

export type Binding = {
  variable: Variable;
  baseline: "import" | "deadzone" | "undefined";
  write: Write;
};

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

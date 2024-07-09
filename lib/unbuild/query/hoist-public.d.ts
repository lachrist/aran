import type { Variable } from "../../estree";
import type { Path } from "../../path";

export type SloppyFunctionProperty = "nope" | "nearby" | "distant";

export type Binding = {
  variable: Variable;
  baseline: "live" | "dead";
  write: "perform" | "report" | "ignore";
  sloppy_function_near_counter: number;
  sloppy_function_away_counter: number;
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

import type { Variable } from "../../estree";
import type { Path } from "../../path";

export type SloppyFunction = "nope" | "near" | "away" | "both";

export type Binding = {
  variable: Variable;
  baseline: "live" | "dead";
  write: "perform" | "report" | "ignore";
  sloppy_function: SloppyFunction;
};

export type EarlyError = {
  cause: "duplicate" | "keyword";
  variable: Variable;
  origin: Path;
};

export type Hoisting = { [key in Path]?: Binding[] };

export type Result = {
  report: EarlyError[];
  unbound: Binding[];
  hoisting: Hoisting;
};

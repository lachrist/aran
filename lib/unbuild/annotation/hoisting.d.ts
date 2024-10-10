import type { VariableName } from "estree-sentry";
import type { Hash } from "../../hash";

export type SloppyFunction = "nope" | "near" | "away" | "both";

export type Write = "perform" | "report" | "ignore";

export type Baseline = "live" | "dead";

export type Binding = {
  variable: VariableName;
  duplicable: boolean;
  baseline: Baseline;
  write: Write;
  sloppy_function: SloppyFunction;
};

export type Error = {
  message: string;
  origin: Hash;
};

export type Hoisting = {
  [key in Hash]?: Binding[];
};

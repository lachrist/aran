import type { VariableName } from "estree-sentry";
import type { Hash } from "../../hash";

export type SloppyFunction = "nope" | "near" | "away" | "both";

export type Binding = {
  variable: VariableName;
  baseline: "live" | "dead";
  write: "perform" | "report" | "ignore";
  sloppy_function: SloppyFunction;
};

export type Error = {
  message: string;
  origin: Hash;
};

export type Hoisting = {
  [key in Hash]?: Binding[];
};

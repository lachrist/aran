import type { VariableName } from "estree-sentry";
import type { Hash } from "../../hash";

export type SloppyFunction = "nope" | "near" | "away" | "both";

export type Write = "perform" | "report" | "ignore";

export type Baseline = "live" | "dead";

export type Initial =
  | "undefined"
  | "deadzone"
  | "import"
  | "self-function"
  | "self-class"
  | "arguments";

export type Binding = {
  variable: VariableName;
  duplicable: boolean;
  initial: Initial;
  write: Write;
  sloppy_function_near: number;
  sloppy_function_away: number;
};

export type Error = {
  message: string;
  origin: Hash;
};

export type Hoisting = {
  [key in Hash]?: Binding[];
};

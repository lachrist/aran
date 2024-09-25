import type { Variable } from "../../estree";
import type { Hash } from "../../hash";

export type SloppyFunction = "nope" | "near" | "away" | "both";

export type Binding = {
  variable: Variable;
  baseline: "live" | "dead";
  write: "perform" | "report" | "ignore";
  sloppy_function: SloppyFunction;
};

export type Error = {
  message: string;
  origin: Hash;
};

type foo = Record<string, Binding>;

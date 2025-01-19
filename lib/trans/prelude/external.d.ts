import type { VariableName } from "estree-sentry";
import type { Hash } from "../hash";

export type ReifyExternal = {
  conflict_with_global_constant: boolean;
  variable: VariableName;
  origin: Hash;
};

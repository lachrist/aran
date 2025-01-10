import type { VariableName } from "estree-sentry";
import type { Hash } from "../hash";

export type ReifyExternal = {
  frame: "aran.global" | "aran.record";
  variable: VariableName;
  origin: Hash;
};

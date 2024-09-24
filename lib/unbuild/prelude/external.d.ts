import type { Variable } from "../../estree";
import type { Hash } from "../../hash";

export type ReifyExternal = {
  frame: "aran.global" | "aran.record";
  variable: Variable;
  origin: Hash;
};
